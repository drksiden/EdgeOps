package physical

import (
	"encoding/json"
	"fmt"
	"net"
)

func ValidateConnection(kind string, raw json.RawMessage) error {
	if len(raw) == 0 || !json.Valid(raw) {
		return fmt.Errorf("%w: connection config must be valid JSON", ErrInvalid)
	}
	switch kind {
	case "native_mqtt":
		var c struct {
			ClientID string `json:"clientId"`
		}
		if json.Unmarshal(raw, &c) != nil || c.ClientID == "" {
			return fmt.Errorf("%w: native_mqtt requires clientId", ErrInvalid)
		}
	case "modbus_rtu":
		var c struct {
			Port                              string `json:"port"`
			Baud, DataBits, StopBits, SlaveID int
			Parity                            string `json:"parity"`
		}
		if json.Unmarshal(raw, &c) != nil || c.Port == "" || c.Baud <= 0 || (c.DataBits != 7 && c.DataBits != 8) || (c.StopBits != 1 && c.StopBits != 2) || c.SlaveID < 1 || c.SlaveID > 247 || (c.Parity != "none" && c.Parity != "even" && c.Parity != "odd") {
			return fmt.Errorf("%w: invalid modbus_rtu config", ErrInvalid)
		}
	case "modbus_tcp":
		var c struct {
			Host         string `json:"host"`
			Port, UnitID int
		}
		if json.Unmarshal(raw, &c) != nil || c.Host == "" || c.Port < 1 || c.Port > 65535 || c.UnitID < 0 || c.UnitID > 255 {
			return fmt.Errorf("%w: invalid modbus_tcp config", ErrInvalid)
		}
		if net.ParseIP(c.Host) == nil {
			return fmt.Errorf("%w: modbus_tcp host must be an IP address", ErrInvalid)
		}
	default:
		return fmt.Errorf("%w: unsupported connection type", ErrInvalid)
	}
	return nil
}
