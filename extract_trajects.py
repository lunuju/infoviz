import psycopg2
import traceback
import pandas as pd
from collections import defaultdict
from multiprocessing import Pool

STIB_LINES = [
    1, 12, 13, 14, 15, 17, 19, 2, 20, 21, 22, 25, 27, 28, 29, 3, 32, 34, 36,
    38, 39, 4, 41, 42, 43, 44, 45, 46, 47, 48, 49, 5, 50, 51, 53, 54, 55, 57,
    58, 59, 6, 60, 61, 62, 63, 64, 65, 66, 69, 7, 71, 72, 75, 76, 77, 78, 79,
    80, 81, 82, 84, 86, 87, 88, 89, 92, 93, 94, 95, 97, 98
]


def skip_terminus(traject):
    index = -1
    for i, l in enumerate(traject):
        time, stop = l
        if stop == 0:
            index = i
        else:
            break
    last_terminus = index
    if last_terminus >= 0:
        return traject[last_terminus:]
    else:
        return traject


def reduce_traject(traject):
    seen_stops = set()
    ret = []
    for time, stop in traject:
        if stop not in seen_stops:
            ret.append([time, stop])
            seen_stops.add(stop)
    return ret


def get_trajects(line, direction):
    assert direction in [1, 2]
    query = """SELECT * FROM heading
               WHERE line='%(line)s' AND way=%(direction)s
               ORDER BY id;"""

    conn = psycopg2.connect(database="delay")
    conn.autocommit = True

    cur = conn.cursor()
    cur.execute(query, {'line': line, 'direction': direction})
    data = cur.fetchall()

    aligned = []
    next_id = 0
    for i, row in enumerate(data):
        id, line, way, positions, date = row
        new_row = []
        for j, stop in enumerate(positions):
            if stop:
                # first row
                if i == 0:
                    id = next_id
                    next_id += 1
                elif j-1 >= 0 and aligned[i-1][j-1] and aligned[i-1][j-1] not in new_row:
                    id = aligned[i-1][j-1]
                elif aligned[i-1][j] and aligned[i-1][j] not in new_row:
                    id = aligned[i-1][j]
                else:
                    id = next_id
                    next_id += 1
            else:
                id = False
            new_row.append(id)
        aligned.append(new_row)

    raw_trajects = defaultdict(list)
    for data_row, aligned_row in zip(data, aligned):
        _, _, _, _, date = data_row
        for i, stop in enumerate(aligned_row):
            if stop:
                raw_trajects[stop].append((date, i))

    trajects = raw_trajects.values()
    trajects = map(skip_terminus, trajects)
    trajects = map(reduce_traject, trajects)
    # Remove short (and thus bogus trajects)
    trajects = filter(lambda x: len(x) > 4, trajects)
    return list(trajects)


def trajects_to_dataframe(trajects):
    rows = []
    for vehicle_pos in trajects:
        r = {}
        for time, stop_id in vehicle_pos:
            r[stop_id] = time
        r['departure'] = vehicle_pos[0][0]
        r['arrival'] = vehicle_pos[-1][0]
        rows.append(r)

    df = pd.DataFrame(rows)
    df.set_index(['departure', 'arrival'], inplace=True)
    return df.apply(lambda x: x.dropna().diff()/pd.Timedelta(seconds=1), axis=1)


def traject_to_csv(kwargs):
    filename = "datasets/{line}-{direction}.csv".format(**kwargs)
    try:
        traj = get_trajects(**kwargs)
        df = trajects_to_dataframe(traj)
        df.to_csv(filename)
        return df
    except:
        traceback.print_exc()


def extract_trajects():
    keys = [{'line': l, 'direction': w} for l in STIB_LINES for w in [1, 2]]
    return Pool(8).map(traject_to_csv, keys)

if __name__ == "__main__":
    extract_trajects()
