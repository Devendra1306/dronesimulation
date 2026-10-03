#!/usr/bin/env python3
"""ROS 2 Launch file for RoboEdge Quadrotor Simulation with Gazebo & rosbridge."""

import os
from launch import LaunchDescription
from launch.actions import ExecuteProcess

def generate_launch_description():
    pkg_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    world_file = os.path.join(pkg_dir, 'worlds', 'quadrotor_test.world')

    # 1. Start Gazebo gzserver and gzclient with the world containing embedded quadrotor
    gazebo_cmd = ExecuteProcess(
        cmd=['gazebo', '--verbose', world_file, '-s', 'libgazebo_ros_init.so', '-s', 'libgazebo_ros_factory.so'],
        output='screen'
    )

    # 2. Start rosbridge WebSocket server on 0.0.0.0:9090
    rosbridge_server = ExecuteProcess(
        cmd=['ros2', 'launch', 'rosbridge_server', 'rosbridge_websocket_launch.xml', 'address:=0.0.0.0', 'port:=9090'],
        output='screen'
    )

    return LaunchDescription([
        gazebo_cmd,
        rosbridge_server
    ])
