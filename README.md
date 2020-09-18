# zephyr-ingester

Pulls Zephyr data from the Earthsense API. Intended to be run as a CronJob.

Uses a database to control what resolution of data to pull in for each Zephyr. E.g. you may only want 10-secondly data pulled in for a few Zephyrs (i.e. mobile ones), for all the others you might be happy just pulling in 15 minutely data. There's the ability to pull in more than one resolution, e.g. you might want both hourly and daily averages for a given Zephyr.


## Documentation

See */docs* folder.

[Earthsense Product Resources](https://www.earthsense.co.uk/product-resources) 
