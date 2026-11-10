#pragma once

typedef void (*edgeops_wifi_connected_callback_t)(void);

void edgeops_wifi_start(edgeops_wifi_connected_callback_t connected_callback);
