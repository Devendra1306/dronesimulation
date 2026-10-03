#!/bin/bash
set -e

echo "=== Setting up ROS 2 Humble & Gazebo on Ubuntu 22.04 ==="

# Set non-interactive debconf
export DEBIAN_FRONTEND=noninteractive

echo "Updating repositories..."
sudo apt-get update -y
sudo apt-get install -y software-properties-common curl gnupg lsb-release

echo "Adding ROS 2 apt repository..."
sudo curl -sSL https://raw.githubusercontent.com/ros/rosdistro/master/ros.key -o /usr/share/keyrings/ros-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/ros-archive-keyring.gpg] http://packages.ros.org/ros2/ubuntu jammy main" | sudo tee /etc/apt/sources.list.d/ros2.list > /dev/null

echo "Installing ROS 2 Humble desktop, Gazebo, and rosbridge-suite..."
sudo apt-get update -y
sudo apt-get install -y ros-humble-desktop gazebo ros-humble-gazebo-ros-pkgs ros-humble-rosbridge-suite

echo "Configuring environment in ~/.bashrc..."
grep -qxF 'source /opt/ros/humble/setup.bash' ~/.bashrc || echo 'source /opt/ros/humble/setup.bash' >> ~/.bashrc

echo "=== Installation complete ==="
