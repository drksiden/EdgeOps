package physical

import "errors"

var (
	ErrNotFound  = errors.New("physical resource not found")
	ErrForbidden = errors.New("tenant access denied")
	ErrConflict  = errors.New("physical resource conflict")
	ErrInvalid   = errors.New("invalid physical resource")
)
