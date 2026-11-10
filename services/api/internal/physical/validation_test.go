package physical

import (
	"encoding/json"
	"errors"
	"testing"
)

func TestValidateConnection(t *testing.T) {
	tests := []struct {
		name, kind string
		config     json.RawMessage
		wantErr    bool
	}{
		{"native mqtt", "native_mqtt", json.RawMessage(`{"clientId":"node-1"}`), false},
		{"missing client", "native_mqtt", json.RawMessage(`{}`), true},
		{"modbus rtu", "modbus_rtu", json.RawMessage(`{"port":"rs485-1","baud":9600,"dataBits":8,"parity":"none","stopBits":1,"slaveId":3}`), false},
		{"invalid slave", "modbus_rtu", json.RawMessage(`{"port":"rs485-1","baud":9600,"dataBits":8,"parity":"none","stopBits":1,"slaveId":248}`), true},
		{"modbus tcp", "modbus_tcp", json.RawMessage(`{"host":"192.168.1.4","port":502,"unitId":1}`), false},
		{"hostname rejected", "modbus_tcp", json.RawMessage(`{"host":"plc.local","port":502,"unitId":1}`), true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateConnection(tt.kind, tt.config)
			if tt.wantErr && !errors.Is(err, ErrInvalid) {
				t.Fatalf("expected ErrInvalid, got %v", err)
			}
			if !tt.wantErr && err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
		})
	}
}
