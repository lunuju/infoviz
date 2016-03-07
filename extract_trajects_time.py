import psycopg2 as pg
import traceback
from collections import defaultdict

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

    conn = pg.connect(database="delay")
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


def extract_line(line):
    found = 0
    conn = pg.connect(database='delay')
    cur = conn.cursor()
    query = 'INSERT INTO legs (departure,arrival,line,from_stop_id,to_stop_id) VALUES (%s,%s,%s,%s,%s)'
    for direction in [1, 2]:
        trajs = get_trajects(line['lineNo'], direction)
        stops = line[str(direction)]
        for t in trajs:
            for (t1, idx1), (t2, idx2) in zip(t[:-1], t[1:]):
                dt = (t2-t1).total_seconds()
                if dt > 6*3600:
                    continue
                record = [t1, t2, line['lineNo'], stops[idx1], stops[idx2]]
                cur.execute(query, record)
                found += 1
    conn.commit()
    print "Finished line", line['lineNo'], "with", found, "legs"


if __name__ == "__main__":
    import json

    for line in json.load(open('stib-lines.json')):
        try:
            extract_line(line)
        except:
            print "Error with line", line['lineNo']
            traceback.print_exc()
