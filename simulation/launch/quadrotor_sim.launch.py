#!/usr/bin/env python3
"""ROS 2 Launch file for RoboEdge Real 3D Quadrotor Simulation with Gazebo & rosbridge."""

import os
from launch import LaunchDescription
from launch.actions import ExecuteProcess

def generate_launch_description():
    pkg_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    world_file = os.path.join(pkg_dir, 'worlds', 'quadrotor_test.world')
    plugin_dir = os.path.join(pkg_dir, 'lib')

    env = dict(os.environ)
    curr_plugin_path = env.get('GAZEBO_PLUGIN_PATH', '')
    env['GAZEBO_PLUGIN_PATH'] = f"{plugin_dir}:{curr_plugin_path}"

    # 1. Start Gazebo with the 3D Quadrotor World & ROS 2 plugins
    gazebo_cmd = ExecuteProcess(
        cmd=['gazebo', '--verbose', world_file, '-s', 'libgazebo_ros_init.so', '-s', 'libgazebo_ros_factory.so'],
        additional_env=env,
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
