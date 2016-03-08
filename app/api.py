from flask import Flask, request
from flask.ext.cors import CORS
import psycopg2 as pg
from psycopg2.extras import RealDictCursor
from datetime import timedelta
import json

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests


def cast(a_dict):
    for k, v in a_dict.iteritems():
        if isinstance(v, timedelta):
            a_dict[k] = v.total_seconds()
    return a_dict


def sql(query, args):
    conn = pg.connect(database='delay')
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(query, args)
    return json.dumps(map(cast, cur.fetchall()))


@app.route("/api")
def api():
    query = """
    SELECT from_stop_id,
           to_stop_id,
           COUNT(*) AS count,
           COUNT(*) / (extract('epoch' from %(to_time)s::timestamp - %(from_time)s::timestamp)/3600) AS per_hour,
           avg(arrival - departure) AS avg_time,
           max(arrival - departure) AS max_time,
           min(arrival - departure) AS min_time
    FROM legs
    WHERE departure >= %(from_time)s AND arrival <= %(to_time)s
    GROUP BY from_stop_id, to_stop_id;
    """
    args = {
        'from_time': request.args.get('from_time', '2016-03-01'),
        'to_time': request.args.get('to_time', '2016-03-03')
    }
    return sql(query, args)


@app.route('/')
def home():
    return app.send_static_file('index.html')


@app.route('/<path:path>')
def static_proxy(path):
    return app.send_static_file(path)


if __name__ == "__main__":
    app.run(debug=True)
