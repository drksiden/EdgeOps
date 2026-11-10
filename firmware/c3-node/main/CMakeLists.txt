idf_component_register(
    SRCS
        "app_main.c"
        "edgeops_device.c"
        "edgeops_mqtt.c"
        "edgeops_wifi.c"
    INCLUDE_DIRS "."
    REQUIRES esp_event esp_netif esp_wifi espressif__mqtt nvs_flash
)
