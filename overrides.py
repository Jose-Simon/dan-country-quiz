# Hand-edited corrections and additions merged in by build_data.py.
# Edit this file, then run:  python build_data.py
# All codes are ISO alpha-3 (cca3) as used by the source dataset. Kosovo is "UNK".

# Flag Entries that count as Countries even though the source data says they
# are not UN members. Guinea-Bissau IS a UN member - the source data is wrong.
EXTRA_COUNTRIES = {"VAT", "PSE", "TWN", "UNK", "GNB"}

# Territories that fly their Country's flag are left out of the game, since
# their flag can't be told apart. build_data.py finds exact copies of a
# Country's flag file by itself; list look-alikes it can't detect here.
SAME_FLAG_AS_COUNTRY = {
    "HMD",  # Heard Island and McDonald Islands - Australia's flag
}

# Display Names that differ from the source data's common name.
DISPLAY_NAMES = {
    "SHN": "Saint Helena",
}

# Other Names accepted as answers and searched by the dropdown.
# ("Saint ..." names automatically also accept "St ..." and "St. ...")
OTHER_NAMES = {
    "USA": ["USA", "United States of America", "America"],
    "GBR": ["UK", "Great Britain", "Britain"],
    "NLD": ["Holland"],
    "CIV": ["Côte d'Ivoire"],
    "CZE": ["Czech Republic"],
    "TUR": ["Türkiye"],
    "SWZ": ["Swaziland"],
    "MMR": ["Burma"],
    "CPV": ["Cabo Verde"],
    "TLS": ["East Timor"],
    "COD": ["Democratic Republic of the Congo", "DRC", "Congo-Kinshasa"],
    "COG": ["Congo", "Congo-Brazzaville"],
    "KOR": ["Korea"],
    "PRK": ["DPRK"],
    "MKD": ["Macedonia"],
    "VAT": ["Holy See", "Vatican"],
    "ARE": ["UAE"],
    "FSM": ["Federated States of Micronesia"],
    "RUS": ["Russian Federation"],
    "BIH": ["Bosnia"],
    "TTO": ["Trinidad"],
    "ATG": ["Antigua"],
    "BHS": ["The Bahamas"],
    "GMB": ["The Gambia"],
    "PSE": ["State of Palestine"],
    "MAC": ["Macao"],
    "VIR": ["US Virgin Islands"],
    "UMI": ["US Minor Outlying Islands"],
    "SHN": ["Saint Helena, Ascension and Tristan da Cunha", "Ascension Island", "Tristan da Cunha"],
    "SGS": ["South Georgia and the South Sandwich Islands"],
    "FLK": ["Falklands"],
    "CCK": ["Cocos Islands", "Keeling Islands"],
    "PCN": ["Pitcairn"],
}

# Neighbour Clue for Territories: the Country each one belongs to,
# or a custom sentence where "belongs to" doesn't fit.
TERRITORY_OWNERS = {
    "HKG": "CHN", "MAC": "CHN",
    "PRI": "USA", "GUM": "USA", "VIR": "USA", "ASM": "USA", "MNP": "USA", "UMI": "USA",
    "REU": "FRA", "GLP": "FRA", "MTQ": "FRA", "MYT": "FRA", "GUF": "FRA", "PYF": "FRA",
    "NCL": "FRA", "WLF": "FRA", "BLM": "FRA", "SPM": "FRA", "MAF": "FRA", "ATF": "FRA",
    "CUW": "NLD", "ABW": "NLD", "SXM": "NLD", "BES": "NLD",
    "JEY": "GBR", "IMN": "GBR", "GGY": "GBR", "BMU": "GBR", "CYM": "GBR", "TCA": "GBR",
    "VGB": "GBR", "GIB": "GBR", "AIA": "GBR", "SHN": "GBR", "MSR": "GBR", "FLK": "GBR",
    "IOT": "GBR", "SGS": "GBR", "PCN": "GBR",
    "GRL": "DNK", "FRO": "DNK",
    "ALA": "FIN",
    "COK": "NZL", "TKL": "NZL", "NIU": "NZL",
    "SJM": "NOR", "BVT": "NOR",
    "NFK": "AUS", "CXR": "AUS", "CCK": "AUS", "HMD": "AUS",
    "ESH": "Mostly controlled by Morocco",
    "ATA": "Belongs to no country - nearest is Chile",
}

# Neighbour Clue for Countries with no land border: nearest neighbour across the sea.
ISLAND_NEIGHBOURS = {
    "ATG": "KNA", "AUS": "PNG", "BHR": "SAU", "BHS": "USA", "BRB": "VCT",
    "COM": "MDG", "CPV": "SEN", "CUB": "HTI", "CYP": "TUR", "DMA": "LCA",
    "FJI": "TON", "FSM": "PLW", "GRD": "VCT", "ISL": "GRL", "JAM": "CUB",
    "JPN": "KOR", "KIR": "MHL", "KNA": "ATG", "LCA": "VCT", "LKA": "IND",
    "MDG": "MOZ", "MDV": "IND", "MHL": "FSM", "MLT": "ITA", "MUS": "MDG",
    "NRU": "KIR", "NZL": "AUS", "PHL": "MYS", "PLW": "IDN", "SGP": "MYS",
    "SLB": "PNG", "STP": "GAB", "SYC": "MDG", "TON": "FJI", "TTO": "VEN",
    "TUV": "FJI", "TWN": "CHN", "VCT": "LCA", "VUT": "SLB", "WSM": "TON",
}

# Capitals that differ from the source data, first one is shown first. A Country
# with two capitals, or a capital and a separate seat of government, lists both.
# A city may be the Capital of only one Country.
CAPITALS = {
    "BOL": ["Sucre", "La Paz"],
    "NLD": ["Amsterdam", "The Hague"],
    "BEN": ["Porto-Novo", "Cotonou"],
    "CIV": ["Yamoussoukro", "Abidjan"],
    "LKA": ["Sri Jayawardenepura Kotte", "Colombo"],
    "MYS": ["Kuala Lumpur", "Putrajaya"],
    "SWZ": ["Mbabane", "Lobamba"],
    "PSE": ["Ramallah"],
    "MNG": ["Ulaanbaatar"],
    "GRD": ["Saint George's"],
}

# Other names a Capital is known by, accepted as answers and searched by the dropdown.
# ("Saint ..." names automatically also accept "St ..." and "St. ...")
CAPITAL_OTHER_NAMES = {
    "UKR": ["Kiev"],
    "YEM": ["Sanaa"],
    "MMR": ["Nay Pyi Taw"],
    "KAZ": ["Nur-Sultan"],
    "CHN": ["Peking"],
    "TCD": ["Ndjamena"],
    "LKA": ["Kotte"],
    "USA": ["Washington", "Washington DC"],
    "MNG": ["Ulan Bator"],
    "TON": ["Nukualofa"],
    "VNM": ["Ha Noi"],
    "SMR": ["San Marino"],
    "ISL": ["Reykjavík"],
}
