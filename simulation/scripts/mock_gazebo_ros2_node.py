#!/usr/bin/env python3
"""Standalone ROS 2 Node simulating a Gazebo Quadrotor.

Publishes authentic ROS 2 messages:
  - /odom (nav_msgs/msg/Odometry)
  - /imu/data (sensor_msgs/msg/Imu)
  - /gps/fix (sensor_msgs/msg/NavSatFix)
  - /camera/image_raw (sensor_msgs/msg/Image)
Subscribes to:
  - /cmd_vel (geometry_msgs/msg/Twist)

Useful for verifying the complete ROS 2 -> rosbridge -> FastAPI -> React pipeline
in headless WSL2 environments before launching the full Gazebo GUI.
"""

import sys
import time
import math

try:
    import rclpy
    from rclpy.node import Node
    from geometry_msgs.msg import Twist
    from nav_msgs.msg import Odometry
    from sensor_msgs.msg import Imu, NavSatFix, Image
except ImportError:
    print("[ERROR] rclpy or ROS 2 messages not installed in this Python environment.")
    print("Run inside an active ROS 2 environment: 'source /opt/ros/humble/setup.bash'")
    sys.exit(1)


class SimulatedQuadrotorNode(Node):
    def __init__(self):
        super().__init__('simulated_gazebo_quadrotor')
        self.get_logger().info('Starting Simulated Gazebo Quadrotor ROS 2 Node...')

        # Publishers
        self.odom_pub = self.create_publisher(Odometry, '/odom', 10)
        self.imu_pub = self.create_publisher(Imu, '/imu/data', 10)
        self.gps_pub = self.create_publisher(NavSatFix, '/gps/fix', 10)
        self.cam_pub = self.create_publisher(Image, '/camera/image_raw', 10)

        # Subscriber
        self.cmd_sub = self.create_subscription(Twist, '/cmd_vel', self.cmd_vel_callback, 10)

        # State
        self.x = 0.0
        self.y = 0.0
        self.z = 0.0
        self.vx = 0.0
        self.vy = 0.0
        self.vz = 0.0
        self.yaw = 0.0

        # Timers
        self.timer_odom = self.create_timer(0.02, self.publish_odom)  # 50 Hz
        self.timer_imu = self.create_timer(0.01, self.publish_imu)    # 100 Hz
        self.timer_gps = self.create_timer(0.1, self.publish_gps)     # 10 Hz
        self.timer_cam = self.create_timer(0.066, self.publish_camera) # 15 Hz

        self.last_time = time.time()
        self.get_logger().info('Quadrotor publishers online: /odom, /imu/data, /gps/fix, /camera/image_raw')

    def cmd_vel_callback(self, msg: Twist):
        self.vx = msg.linear.x
        self.vy = msg.linear.y
        self.vz = msg.linear.z
        self.get_logger().info(f'Received /cmd_vel: vx={self.vx:.2f}, vy={self.vy:.2f}, vz={self.vz:.2f}')

    def publish_odom(self):
        now = time.time()
        dt = now - self.last_time
        self.last_time = now

        # Integrate velocity
        self.x += self.vx * dt
        self.y += self.vy * dt
        self.z = max(0.0, self.z + self.vz * dt)

        msg = Odometry()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.header.frame_id = 'odom'
        msg.child_frame_id = 'base_link'
        msg.pose.pose.position.x = self.x
        msg.pose.pose.position.y = self.y
        msg.pose.pose.position.z = self.z
        msg.twist.twist.linear.x = self.vx
        msg.twist.twist.linear.y = self.vy
        msg.twist.twist.linear.z = self.vz
        self.odom_pub.publish(msg)

    def publish_imu(self):
        msg = Imu()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.header.frame_id = 'imu_link'
        msg.orientation.w = 1.0
        msg.linear_acceleration.z = 9.81
        self.imu_pub.publish(msg)

    def publish_gps(self):
        msg = NavSatFix()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.header.frame_id = 'gps_link'
        msg.latitude = 16.5062 + (self.y / 111111.0)
        msg.longitude = 80.6480 + (self.x / (111111.0 * math.cos(math.radians(16.5062))))
        msg.altitude = 25.0 + self.z
        self.gps_pub.publish(msg)

    def publish_camera(self):
        msg = Image()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.header.frame_id = 'camera_link'
        msg.height = 120
        msg.width = 160
        msg.encoding = 'rgb8'
        msg.step = 160 * 3
        # Synthetic RGB pattern
        msg.data = [30, 40, 60] * (160 * 120)
        self.cam_pub.publish(msg)


def main(args=None):
    rclpy.init(args=args)
    node = SimulatedQuadrotorNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
