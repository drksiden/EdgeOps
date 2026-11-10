#include "edgeops_device.h"

#include <stdio.h>

#include "esp_system.h"
#include "sdkconfig.h"

const char *edgeops_device_id(void)
{
    return CONFIG_EDGEOPS_DEVICE_ID;
}

const char *edgeops_device_name(void)
{
    return CONFIG_EDGEOPS_DEVICE_NAME;
}

const char *edgeops_mqtt_broker_uri(void)
{
    return CONFIG_EDGEOPS_MQTT_BROKER_URI;
}

void edgeops_device_presence_topic(char *buffer, size_t buffer_size)
{
    snprintf(buffer, buffer_size, "edgeops/v1/devices/%s/up/presence", edgeops_device_id());
}

void edgeops_device_state_topic(char *buffer, size_t buffer_size)
{
    snprintf(buffer, buffer_size, "edgeops/v1/devices/%s/up/state", edgeops_device_id());
}

void edgeops_device_online_payload(char *buffer, size_t buffer_size)
{
    snprintf(buffer, buffer_size,
             "{\"status\":\"online\",\"firmwareVersion\":\"%s\",\"hardware\":\"%s\",\"deviceName\":\"%s\"}",
             EDGEOPS_FIRMWARE_VERSION, EDGEOPS_HARDWARE_NAME, edgeops_device_name());
}

void edgeops_device_offline_payload(char *buffer, size_t buffer_size)
{
    snprintf(buffer, buffer_size, "{\"status\":\"offline\"}");
}

void edgeops_device_state_payload(char *buffer, size_t buffer_size, uint64_t uptime_seconds)
{
    snprintf(buffer, buffer_size,
             "{\"firmwareVersion\":\"%s\",\"uptimeSeconds\":%llu,\"freeHeapBytes\":%lu}",
             EDGEOPS_FIRMWARE_VERSION,
             (unsigned long long)uptime_seconds,
             (unsigned long)esp_get_free_heap_size());
}
