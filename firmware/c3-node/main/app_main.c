#include "edgeops_device.h"
#include "edgeops_mqtt.h"
#include "edgeops_wifi.h"

#include "esp_err.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "sdkconfig.h"

static const char *TAG = "edgeops_node";

static void wifi_connected(void)
{
    edgeops_mqtt_start();
}

void app_main(void)
{
    esp_err_t nvs_result = nvs_flash_init();
    if (nvs_result == ESP_ERR_NVS_NO_FREE_PAGES ||
        nvs_result == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ESP_ERROR_CHECK(nvs_flash_init());
    } else {
        ESP_ERROR_CHECK(nvs_result);
    }

    ESP_LOGI(TAG, "EdgeOps native node booting firmware=%s hardware=%s",
             EDGEOPS_FIRMWARE_VERSION, EDGEOPS_HARDWARE_NAME);
    ESP_LOGI(TAG, "device_id=%s device_name=%s",
             edgeops_device_id(), edgeops_device_name());

    if (CONFIG_EDGEOPS_WIFI_SSID[0] == '\0' || CONFIG_EDGEOPS_MQTT_BROKER_URI[0] == '\0' ||
        CONFIG_EDGEOPS_DEVICE_ID[0] == '\0') {
        ESP_LOGE(TAG, "Wi-Fi SSID, MQTT broker URI, and EdgeOps Device ID must be configured");
        return;
    }

    edgeops_wifi_start(wifi_connected);
}
