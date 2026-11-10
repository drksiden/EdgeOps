#pragma once

#include <stddef.h>
#include <stdint.h>

#define EDGEOPS_FIRMWARE_VERSION "0.1.0"
#define EDGEOPS_HARDWARE_NAME "esp32-c3"

const char *edgeops_device_id(void);
const char *edgeops_device_name(void);
const char *edgeops_mqtt_broker_uri(void);

void edgeops_device_presence_topic(char *buffer, size_t buffer_size);
void edgeops_device_state_topic(char *buffer, size_t buffer_size);
void edgeops_device_online_payload(char *buffer, size_t buffer_size);
void edgeops_device_offline_payload(char *buffer, size_t buffer_size);
void edgeops_device_state_payload(char *buffer, size_t buffer_size, uint64_t uptime_seconds);
