#!/usr/bin/env python3
"""ROS 2 Launch file for RoboEdge Quadrotor Simulation with Gazebo & rosbridge."""

import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import ExecuteProcess, DeclareLaunchArgument, IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration

def generate_launch_description():
    pkg_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    world_file = os.path.join(pkg_dir, 'worlds', 'quadrotor_test.world')
    model_file = os.path.join(pkg_dir, 'models', 'quadrotor', 'model.sdf')

    # 1. Start Gazebo gzserver and gzclient
    gazebo_cmd = ExecuteProcess(
        cmd=['gazebo', '--verbose', world_file, '-s', 'libgazebo_ros_init.so', '-s', 'libgazebo_ros_factory.so'],
        output='screen'
    )

    # 2. Spawn Quadrotor Model
    spawn_drone = ExecuteProcess(
        cmd=['ros2', 'run', 'gazebo_ros', 'spawn_entity.py', '-file', model_file, '-entity', 'quadrotor', '-z', '0.2'],
        output='screen'
    )

    # 3. Start rosbridge WebSocket server on 127.0.0.1:9090
    rosbridge_server = ExecuteProcess(
        cmd=['ros2', 'launch', 'rosbridge_server', 'rosbridge_websocket_launch.xml', 'address:=127.0.0.1', 'port:=9090'],
        output='screen'
    )

    return LaunchDescription([
        gazebo_cmd,
        spawn_drone,
        rosbridge_server
    ])
