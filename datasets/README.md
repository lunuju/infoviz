# Datasets
## File format

The datasets are given in the CSV file format. For each STIB line, in both
directions, there is a file named `{line number}-{direction (1 or 2)}.csv`.

Each one of them contains at least the columns `departure` and `arrival`, and
a variable number of columns identified by an integer. Each row represent an
identified vehicle on this line.

* The `departure` column is the first time the vehicle was seen (traject departure), in the format `%Y-%m-%d %H:%M:%S.%f`
* The `arrival` column is the last time the vehicle was seen (traject arrival), in the same format
* The other columns contains the time in seconds the vehicle took to arrive at a stop.

For instance, the following file:

    departure,arrival,0,1,2
    2012-12-21 10:00:00.0,2012-12-21 10:02:26.8,,67.8,82

indicates that a vehicle started at 10AM, took 67.8 seconds to go from stop 0
to stop 1, then took 82 seconds to go from stop 1 to stop 2, arriving then at
10:02:26 AM.


## Some notes

* The realtime data were sampled every 20 seconds for every line
* The vehicle detection algorithm is still experimental
* A traject could be incomplete (actually most of them are)
