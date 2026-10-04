#include <gazebo/gazebo.hh>
#include <gazebo/physics/physics.hh>
#include <gazebo/common/common.hh>
#include <gazebo_ros/node.hpp>
#include <geometry_msgs/msg/twist.hpp>
#include <nav_msgs/msg/odometry.hpp>
#include <rclcpp/rclcpp.hpp>
#include <ignition/math/Pose3.hh>
#include <ignition/math/Vector3.hh>
#include <ignition/math/Quaternion.hh>
#include <memory>
#include <string>

namespace gazebo
{
class QuadrotorFlightController : public ModelPlugin
{
public:
  QuadrotorFlightController() : ModelPlugin() {}
  virtual ~QuadrotorFlightController() = default;

  void Load(physics::ModelPtr _model, sdf::ElementPtr _sdf) override
  {
    model_ = _model;
    world_ = model_->GetWorld();

    ros_node_ = gazebo_ros::Node::Get(_sdf);

    // Subscribe to /cmd_vel
    cmd_vel_sub_ = ros_node_->create_subscription<geometry_msgs::msg::Twist>(
      "/cmd_vel",
      rclcpp::QoS(10),
      std::bind(&QuadrotorFlightController::OnCmdVel, this, std::placeholders::_1));

    // Publish /odom
    odom_pub_ = ros_node_->create_publisher<nav_msgs::msg::Odometry>(
      "/odom",
      rclcpp::QoS(50));

    last_cmd_time_ = world_->SimTime();
    last_update_time_ = world_->SimTime();

    update_connection_ = event::Events::ConnectWorldUpdateBegin(
      std::bind(&QuadrotorFlightController::OnUpdate, this, std::placeholders::_1));

    RCLCPP_INFO(ros_node_->get_logger(), "Real 3D Quadrotor Flight Controller initialized for %s",
                model_->GetName().c_str());
  }

private:
  void OnCmdVel(const geometry_msgs::msg::Twist::SharedPtr _msg)
  {
    target_cmd_ = *_msg;
    last_cmd_time_ = world_->SimTime();
  }

  void OnUpdate(const common::UpdateInfo & _info)
  {
    common::Time current_time = _info.simTime;
    double dt = (current_time - last_update_time_).Double();
    if (dt <= 0.0) return;
    last_update_time_ = current_time;

    // Timeout safety: if no command received for > 4.0s, hover / hold position
    double time_since_cmd = (current_time - last_cmd_time_).Double();
    geometry_msgs::msg::Twist active_cmd = target_cmd_;
    if (time_since_cmd > 4.0) {
      active_cmd.linear.x = 0.0;
      active_cmd.linear.y = 0.0;
      active_cmd.linear.z = 0.0;
      active_cmd.angular.z = 0.0;
    }

    ignition::math::Pose3d current_pose = model_->WorldPose();

    // Body frame X and Y to World frame
    ignition::math::Vector3d body_vel(active_cmd.linear.x, active_cmd.linear.y, 0.0);
    ignition::math::Vector3d world_horizontal = current_pose.Rot().RotateVector(body_vel);

    // Vertical velocity in world Z
    double target_vz = active_cmd.linear.z;

    // Ground safety: if sitting on ground (< 0.15m) and commanding downwards or stationary, stop
    if (current_pose.Pos().Z() < 0.15 && target_vz <= 0.0 && active_cmd.linear.x == 0.0 && active_cmd.linear.y == 0.0) {
      model_->SetLinearVel(ignition::math::Vector3d(0, 0, 0));
      model_->SetAngularVel(ignition::math::Vector3d(0, 0, 0));
    } else {
      ignition::math::Vector3d total_world_vel(world_horizontal.X(), world_horizontal.Y(), target_vz);
      model_->SetLinearVel(total_world_vel);

      // Yaw rotation around world Z
      ignition::math::Vector3d angular_vel(0, 0, active_cmd.angular.z);
      model_->SetAngularVel(angular_vel);
    }

    // Publish high precision 3D Odometry
    if (odom_pub_) {
      nav_msgs::msg::Odometry odom_msg;
      odom_msg.header.stamp = ros_node_->now();
      odom_msg.header.frame_id = "odom";
      odom_msg.child_frame_id = "base_link";

      odom_msg.pose.pose.position.x = current_pose.Pos().X();
      odom_msg.pose.pose.position.y = current_pose.Pos().Y();
      odom_msg.pose.pose.position.z = current_pose.Pos().Z();

      odom_msg.pose.pose.orientation.x = current_pose.Rot().X();
      odom_msg.pose.pose.orientation.y = current_pose.Rot().Y();
      odom_msg.pose.pose.orientation.z = current_pose.Rot().Z();
      odom_msg.pose.pose.orientation.w = current_pose.Rot().W();

      ignition::math::Vector3d current_lin_vel = model_->WorldLinearVel();
      ignition::math::Vector3d current_ang_vel = model_->WorldAngularVel();

      odom_msg.twist.twist.linear.x = current_lin_vel.X();
      odom_msg.twist.twist.linear.y = current_lin_vel.Y();
      odom_msg.twist.twist.linear.z = current_lin_vel.Z();

      odom_msg.twist.twist.angular.x = current_ang_vel.X();
      odom_msg.twist.twist.angular.y = current_ang_vel.Y();
      odom_msg.twist.twist.angular.z = current_ang_vel.Z();

      odom_pub_->publish(odom_msg);
    }
  }

  physics::ModelPtr model_;
  physics::WorldPtr world_;
  gazebo_ros::Node::SharedPtr ros_node_;
  rclcpp::Subscription<geometry_msgs::msg::Twist>::SharedPtr cmd_vel_sub_;
  rclcpp::Publisher<nav_msgs::msg::Odometry>::SharedPtr odom_pub_;
  event::ConnectionPtr update_connection_;

  geometry_msgs::msg::Twist target_cmd_;
  common::Time last_cmd_time_;
  common::Time last_update_time_;
};

GZ_REGISTER_MODEL_PLUGIN(QuadrotorFlightController)
}
