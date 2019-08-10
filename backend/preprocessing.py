import pandas as pd
import os

# data source: https://dane.imgw.pl/data/dane_pomiarowo_obserwacyjne/dane_meteorologiczne/miesieczne/synop/
dataset_folder_name = "csv"
filenames = os.listdir(dataset_folder_name)

data = []
# t is average month temperature, destination column
colnames = ["station_code", "station_name", "year", "month", "avg_month_cloud", "NOS", "wind_speed", "FWS", "t", "TEMP", "avg_preasssure_h2o",
            "PRES", "wet", "WGLS", "avg_preassure_station_level", "PPPS", "avg_preassure_sea_level", "PPPM", "rain_day", "WODZ", "rain_night", "WONO"]
stations = ["warszawa", "zakopane", "szczecin", "suwałki", "wrocław", "lesko"]
for file in filenames:
    if file.startswith("s_m_t"):
        csv = pd.read_csv(os.path.join(dataset_folder_name, file), encoding='latin1', sep=",", names=colnames)
        csv.station_name.replace('WROC£AW',  'WROCŁAW', inplace=True)
        csv.station_name.replace('SUWA£KI',  'SUWAŁKI', inplace=True)
        csv_sub = csv.loc[csv.station_name.str.lower().isin(stations), ["year", "month", "station_code", "station_name", "t"]]
        data.append(csv_sub)

df = pd.concat(data, axis=0, sort=False)
del data, csv, csv_sub

## exclude noisy data
df = df[~((df.station_name == "WROCŁAW") & (df.year <= 1965)) &
        ~((df.station_name == "WARSZAWA") & (df.year <= 1965))]

## save to scv
for station in df.station_name.unique():
    df[df.station_name == station].to_csv(os.path.join("..","frontend", "preprocessed_csv", station + "_temp_mean.csv"))


