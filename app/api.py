from flask import Flask, request, make_response
from flask.ext.cors import CORS
import psycopg2 as pg
from psycopg2.extras import RealDictCursor
from datetime import timedelta
from config import DEBUG
import json

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests


def cast(a_dict):
    for k, v in a_dict.items():
        if isinstance(v, timedelta):
            a_dict[k] = v.total_seconds()
    return a_dict


def sql(query, args, cache=False):
    conn = pg.connect(database='delay')
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(query, args)
    response = make_response(json.dumps([cast(x) for x in cur.fetchall()]))
    response.headers['Content-type'] = 'application/json'
    response.cache_control.max_age = 3600
    return response


@app.route("/api")
def api():
    query = """
    SELECT from_stop_id,
           to_stop_id,
           %(from_time)s as from_time,
           %(to_time)s as to_time,
           COUNT(*) AS count,
           COUNT(*) / (extract('epoch' from %(to_time)s::timestamp - %(from_time)s::timestamp)/3600) AS per_hour,
           avg(arrival - departure) AS avg_time,
           max(arrival - departure) AS max_time,
           min(arrival - departure) AS min_time,
           array_agg(distinct(line)) AS lines
    FROM legs
    WHERE departure >= %(from_time)s AND arrival <= %(to_time)s AND
          from_stop_id > '0' AND from_stop_id < '10000' AND
          to_stop_id > '0' AND to_stop_id < '10000' AND
    GROUP BY from_stop_id, to_stop_id;
    """
    args = {
        'from_time': request.args.get('from_time', '2016-03-01'),
        'to_time': request.args.get('to_time', '2016-03-03')
    }
    return sql(query, args)


@app.route("/travel_time")
def travel_time():
    query = """
    SELECT line, array_agg(extract('epoch' FROM (arrival - departure))) AS travel_times
    FROM legs
    WHERE departure >= %(from_time)s AND arrival <= %(to_time)s AND
          from_stop_id = %(from_stop)s AND to_stop_id = %(to_stop)s
    GROUP BY line;
    """
    args = {
        'from_time': request.args.get('from_time', '2016-03-01'),
        'to_time': request.args.get('to_time', '2016-03-03'),
        'from_stop': request.args.get('from_stop', '6304'),
        'to_stop': request.args.get('to_stop', '6416'),
    }
    return sql(query, args)


@app.route('/')
def home():
    return app.send_static_file('index.html')


@app.route('/<path:path>')
def static_proxy(path):
    return app.send_static_file(path)


if __name__ == "__main__":
    app.run(debug=DEBUG)
