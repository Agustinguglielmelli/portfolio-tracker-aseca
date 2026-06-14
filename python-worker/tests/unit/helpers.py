from unittest.mock import MagicMock

def _make_conn(fetchall_return=None):
    conn = MagicMock(name="conn")
    cur = MagicMock(name="cursor")
    cur.fetchall.return_value = fetchall_return or []
    conn.cursor.return_value.__enter__ = MagicMock(return_value=cur)
    conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
    return conn, cur
