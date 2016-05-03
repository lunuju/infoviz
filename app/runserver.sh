#!/bin/bash

gunicorn api:app -b 127.0.0.1:5000 -w 10
