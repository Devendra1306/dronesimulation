cmake_minimum_required(VERSION 3.10)
project(gazebo_ros_quadrotor_controller)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(ament_cmake REQUIRED)
find_package(gazebo_ros REQUIRED)
find_package(rclcpp REQUIRED)
find_package(geometry_msgs REQUIRED)
find_package(nav_msgs REQUIRED)
find_package(gazebo REQUIRED)

include_directories(
  ${GAZEBO_INCLUDE_DIRS}
)

link_directories(
  ${GAZEBO_LIBRARY_DIRS}
)

add_library(gazebo_ros_quadrotor_controller SHARED
  src/quadrotor_controller.cpp
)

ament_target_dependencies(gazebo_ros_quadrotor_controller
  gazebo_ros
  rclcpp
  geometry_msgs
  nav_msgs
)

target_link_libraries(gazebo_ros_quadrotor_controller
  ${GAZEBO_LIBRARIES}
)

install(TARGETS gazebo_ros_quadrotor_controller
  ARCHIVE DESTINATION lib
  LIBRARY DESTINATION lib
  RUNTIME DESTINATION bin
)

ament_package()
