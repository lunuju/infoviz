from flask import Flask, request, make_response, g
from flask.ext.cors import CORS
import psycopg2 as pg
from psycopg2.extras import RealDictCursor
from datetime import timedelta
from time import time
from config import DEBUG, Q_CACHE_SIZE
import json

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests


class QueryCache(object):
    def __init__(self, max_entries=10):
        self.max = max_entries
        self.cache = {}

    def get_cursor(self):
        conn = pg.connect(database='delay')
        return conn.cursor(cursor_factory=RealDictCursor)

    def query(self, query, query_args):
        key = repr([query, query_args])
        if key in self.cache:
            print("\033[1;32mUSING CACHED VERSION\033[0m")
        else:
            cur = self.get_cursor()
            cur.execute(query, query_args)
            res = cur.fetchall()
            print("\033[1;33mEXECUTE QUERY\033[0m")

            if len(self.cache) == self.max:
                lru = min(self.cache, key=lambda x: self.cache[x][-1])
                self.cache.pop(lru)
                print("\033[1;34mEVICT LRU\033[0m")
            self.cache[key] = [res, time()]
        self.cache[key][-1] = time()
        return self.cache[key][0]


CACHED_QUERIES = QueryCache(Q_CACHE_SIZE)


def cast(a_dict):
    for k, v in a_dict.iteritems():
        if isinstance(v, timedelta):
            a_dict[k] = v.total_seconds()
    return a_dict


def sql(query, args, cache=False):
    ret = CACHED_QUERIES.query(query, args)
    response = make_response(json.dumps([cast(x) for x in ret]))
    response.headers['Content-type'] = 'application/json'
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
    WHERE departure >= %(from_time)s AND arrival <= %(to_time)s
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
    app.run(debug=DEBUG)
