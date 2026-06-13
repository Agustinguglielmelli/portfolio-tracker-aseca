import os
import sys
from unittest.mock import MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "app"))
sys.path.insert(0, os.path.dirname(__file__))

_yf_stub = MagicMock(name="yfinance_stub")
sys.modules.setdefault("yfinance", _yf_stub)

import pytest

class MockPsycopg2Error(Exception):
    pass

class MockPsycopg2DatabaseError(MockPsycopg2Error):
    pass

_psycopg2_stub = MagicMock(name="psycopg2_stub")
_psycopg2_stub.Error = MockPsycopg2Error
_psycopg2_stub.DatabaseError = MockPsycopg2DatabaseError
sys.modules.setdefault("psycopg2", _psycopg2_stub)

@pytest.fixture(autouse=True)
def reset_mocks():
    _yf_stub.reset_mock()
    _yf_stub.Ticker.reset_mock()
    _yf_stub.Ticker.side_effect = None
    _yf_stub.Ticker.return_value = MagicMock()
    _psycopg2_stub.reset_mock()
