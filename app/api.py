from flask import Flask, request, make_response, g
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


def sql(query, args, cache=False):
    if cache and 'cache' in g:
        as_json = g['cache']
    else:
        conn = pg.connect(database='delay')
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(query, args)
        as_json = json.dumps(map(cast, cur.fetchall()))
        if cache:
            g['cache'] = as_json

    response = make_response(as_json)
    response.headers['Content-type'] = 'application/json'
    return response


@app.route("/api")
def api():
    query = """
    SELECT from_stop_id,
           to_stop_id,
           COUNT(*) AS count,
           COUNT(*) / (extract('epoch' from %(to_time)s::timestamp - %(from_time)s::timestamp)/3600) AS per_hour,
           avg(arrival - departure) AS avg_time,
           max(arrival - departure) AS max_time,
           min(arrival - departure) AS min_time,
           array_agg(distinct(line)) AS lines
    FROM legs
    WHERE departure >= %(from_time)s AND arrival <= %(to_time)s
    GROUP BY from_stop_id, to_stop_id;
    """
    args = {
        'from_time': request.args.get('from_time', '2016-03-01'),
        'to_time': request.args.get('to_time', '2016-03-03')
    }
    return sql(query, args, (args['from_time'] == '2016-03-01 08:00' and args['to_time'] == '2016-03-01 10:00'))


@app.route("/travel_time")
def travel_time():
    query = """
    SELECT array_agg(extract('epoch' FROM (arrival - departure))) AS travel_times
    FROM legs
    WHERE departure >= %(from_time)s AND arrival <= %(to_time)s AND
          from_stop_id = %(from_stop)s AND to_stop_id = %(to_stop)s;
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
    app.run(debug=True)
