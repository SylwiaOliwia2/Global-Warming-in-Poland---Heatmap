import pandas as pd
import numpy as np
import os
import re

#perc_95 = lambda x: np.percentile(x, 95)

for file in os.listdir("raw_csv"):
    metric = 'mean'
    print("File: ", file)
    # preprocessing
    raw_file = pd.read_csv(os.path.join("raw_csv", file), index_col = False, header=6, error_bad_lines=False, sep=";")
    raw_file.columns = [re.sub(r'local time.*', "local_time", c.lower()) for c in raw_file.columns]
    raw_file["year"] = raw_file["local_time"].astype(str).apply(lambda x: int(x[6:10]))
    raw_file["month"] = raw_file["local_time"].astype(str).apply(lambda x: int(x[3:5]))
    final_columns = ["year", "month", "t"]
    raw_file = raw_file.loc[:, final_columns]

    #pivot_table
    pv = raw_file.pivot_table(index=["year", "month"], values="t", aggfunc=metric)
    pv.to_csv(os.path.join("..","frontend","preprocessed_csv",re.sub("raw", metric, file)))
