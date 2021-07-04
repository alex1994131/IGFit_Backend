const mongoose = require('mongoose')
const axios = require('axios')
const cors = require('cors')
const express = require('express');
const config = require('./config')
const { UserModel, PortfolioModel, TransactionModel } = require('./model')
const { create, updateUserByPortfolio, updatePortfolioByTransaction } = require('./helper')

const app = express();

app.use(cors());

let userData = {
	"username": "Test",
	"email": "test@gmail.com",
	"password": "test"
};

let portfolioData = {
	"name": "Test",
	"user_id": "",
	"value": 0,
	"profit": 0
};

const transactionData = [
	[
		"12/14/2020",
		"19:18:46",
		"TRADE",
		"Global Payments Inc",
		"BUY",
		"7",
		"193.47",
		"USD",
		"-1354.29",
		"-10",
		"0",
		"-1031.02",
		"0.7539184",
		"LIMIT",
		"XOFF",
		"Y",
		"16/12/2020",
		"89L4G:1151288~28895",
	],
	[
		"12/14/2020",
		"19:17:59",
		"TRADE",
		"Fiserv Inc",
		"BUY",
		"11",
		"114.205",
		"USD",
		"-1256.26",
		"-10",
		"0",
		"-957.32",
		"0.7540799",
		"LIMIT",
		"XOFF",
		"Y",
		"16/12/2020",
		"89L4G:1151282~28639",
	],
	[
		"12/2/2020",
		"16:09:59",
		"TRADE",
		"Splunk Inc",
		"BUY",
		"6",
		"205.52",
		"USD",
		"-1233.12",
		"-10",
		"0",
		"-939.9",
		"0.7541071",
		"LIMIT",
		"XOFF",
		"Y",
		"04/12/2020",
		"89L4G:1140727~27815",
	],
	[
		"12/2/2020",
		"16:09:47",
		"TRADE",
		"Wix.com Ltd",
		"BUY",
		"6",
		"252.21",
		"USD",
		"-1513.26",
		"-10",
		"0",
		"-1151.33",
		"0.7542203",
		"LIMIT",
		"XOFF",
		"Y",
		"04/12/2020",
		"89L4G:1140724~27277",
	],
	[
		"12/2/2020",
		"13:08:14",
		"TRADE",
		"Prosus NV (NL)",
		"BUY",
		"21",
		"92.5",
		"EUR",
		"-1942.5",
		"-10",
		"0",
		"-1775.13",
		"0.9091608",
		"LIMIT",
		"XOFF",
		"Y",
		"04/12/2020",
		"89L4G:1140724~13871",
	],
	[
		"11/10/2020",
		"17:50:55",
		"TRADE",
		"Elastic B.V.",
		"BUY",
		"13",
		"102.14",
		"USD",
		"-1327.82",
		"0",
		"0",
		"-1007.08",
		"0.7584479",
		"LIMIT",
		"XOFF",
		"Y",
		"13/11/2020",
		"89L4G:1122540~38951",
	],
	[
		"11/10/2020",
		"17:50:29",
		"TRADE",
		"Wix.com Ltd",
		"BUY",
		"5",
		"245.55",
		"USD",
		"-1227.75",
		"0",
		"0",
		"-931.15",
		"0.7584159",
		"LIMIT",
		"XOFF",
		"Y",
		"13/11/2020",
		"89L4G:1120403~38535",
	],
	[
		"10/29/2020",
		"15:17:48",
		"TRADE",
		"Caesars Entertainment Corp",
		"BUY",
		"30",
		"46.48",
		"USD",
		"-1394.4",
		"0",
		"0",
		"-1084.86",
		"0.7780116",
		"LIMIT",
		"XOFF",
		"Y",
		"02/11/2020",
		"89L4G:1113180~25695",
	],
	[
		"10/29/2020",
		"13:54:39",
		"TRADE",
		"Global Payments Inc",
		"BUY",
		"8",
		"156.05",
		"USD",
		"-1248.4",
		"0",
		"0",
		"-970.41",
		"0.7773196",
		"LIMIT",
		"XOFF",
		"Y",
		"02/11/2020",
		"89L4G:1113183~20819",
	],
	[
		"10/29/2020",
		"13:54:30",
		"TRADE",
		"Fiserv Inc",
		"BUY",
		"13",
		"94.28",
		"USD",
		"-1225.64",
		"0",
		"0",
		"-952.71",
		"0.7773196",
		"LIMIT",
		"XOFF",
		"Y",
		"02/11/2020",
		"89L4G:1113183~20812",
	],
	[
		"10/26/2020",
		"16:12:47",
		"TRADE",
		"Elastic B.V.",
		"BUY",
		"13",
		"105.17",
		"USD",
		"-1367.21",
		"0",
		"0",
		"-1055.03",
		"0.7716636",
		"LIMIT",
		"XOFF",
		"Y",
		"28/10/2020",
		"89L4G:1108354~30945",
	],
	[
		"9/24/2020",
		"16:16:05",
		"TRADE",
		"salesforce.com Inc",
		"BUY",
		"6",
		"237",
		"USD",
		"-1422",
		"0",
		"0",
		"-1123.73",
		"0.7902478",
		"LIMIT",
		"XOFF",
		"Y",
		"28/09/2020",
		"89L4G:1081526~27496",
	],
	[
		"9/21/2020",
		"14:36:26",
		"TRADE",
		"Splunk Inc",
		"BUY",
		"8",
		"173.48",
		"USD",
		"-1387.84",
		"0",
		"0",
		"-1087.34",
		"0.7834767",
		"LIMIT",
		"XOFF",
		"Y",
		"23/09/2020",
		"89L4G:1080631~26675",
	],
	[
		"9/21/2020",
		"14:36:01",
		"TRADE",
		"LivePerson Inc",
		"BUY",
		"28",
		"47.4",
		"USD",
		"-1327.2",
		"0",
		"0",
		"-1039.88",
		"0.7835118",
		"LIMIT",
		"XOFF",
		"Y",
		"23/09/2020",
		"89L4G:1080635~26721",
	],
	[
		"9/16/2020",
		"18:39",
		"TRADE",
		"InterActiveCorp",
		"BUY",
		"11",
		"123.485",
		"USD",
		"-1358.34",
		"0",
		"0",
		"-1052.55",
		"0.7748821",
		"LIMIT",
		"XOFF",
		"Y",
		"18/09/2020",
		"89L4G:1076485~27218",
	],
	[
		"8/24/2020",
		"15:18:12",
		"TRADE",
		"Caesars Entertainment Corp",
		"BUY",
		"30",
		"45.46",
		"USD",
		"-1363.8",
		"0",
		"0",
		"-1047.25",
		"0.7678922",
		"LIMIT",
		"XOFF",
		"Y",
		"26/08/2020",
		"89L4G:1048381~27997",
	],
	[
		"8/24/2020",
		"15:07:20",
		"TRADE",
		"Global Payments Inc",
		"BUY",
		"8",
		"168.25",
		"USD",
		"-1346",
		"0",
		"0",
		"-1033.97",
		"0.7681786",
		"LIMIT",
		"XOFF",
		"Y",
		"26/08/2020",
		"89L4G:1048381~27427",
	],
	[
		"8/18/2020",
		"19:46:26",
		"TRADE",
		"Fiserv Inc",
		"BUY",
		"13",
		"102.39",
		"USD",
		"-1331.07",
		"0",
		"0",
		"-1010.52",
		"0.7591773",
		"LIMIT",
		"XOFF",
		"Y",
		"20/08/2020",
		"89L4G:1042921~55486",
	],
	[
		"8/18/2020",
		"19:29:57",
		"TRADE",
		"Caesars Entertainment Corp",
		"BUY",
		"31",
		"42.35",
		"USD",
		"-1312.85",
		"0",
		"0",
		"-996.55",
		"0.7590772",
		"LIMIT",
		"XOFF",
		"Y",
		"20/08/2020",
		"89L4G:1042924~54783",
	],
	[
		"8/12/2020",
		"14:49:55",
		"TRADE",
		"Trivago NV",
		"BUY",
		"650",
		"2.03",
		"USD",
		"-1319.5",
		"0",
		"0",
		"-1016.52",
		"0.7703809",
		"LIMIT",
		"XOFF",
		"Y",
		"14/08/2020",
		"89L4G:1039515~33594",
	],
	[
		"8/12/2020",
		"14:41:32",
		"TRADE",
		"InterActiveCorp",
		"BUY",
		"11",
		"123.2",
		"USD",
		"-1355.2",
		"0",
		"0",
		"-1044.71",
		"0.7708932",
		"LIMIT",
		"XOFF",
		"Y",
		"14/08/2020",
		"89L4G:1039515~34102",
	],
	[
		"8/3/2020",
		"15:08:38",
		"TRADE",
		"DraftKings Inc",
		"BUY",
		"41",
		"32.23",
		"USD",
		"-1321.43",
		"0",
		"0",
		"-1019.35",
		"0.7713991",
		"LIMIT",
		"XOFF",
		"Y",
		"05/08/2020",
		"89L4G:1033839~43803",
	],
	[
		"7/14/2020",
		"15:27:37",
		"TRADE",
		"DraftKings Inc",
		"BUY",
		"41",
		"28.64",
		"USD",
		"-1174.24",
		"0",
		"0",
		"-942.05",
		"0.8022671",
		"LIMIT",
		"XOFF",
		"Y",
		"16/07/2020",
		"89L4G:1021052~44308",
	],
	[
		"7/13/2020",
		"15:40:06",
		"TRADE",
		"Prosus NV (NL)",
		"BUY",
		"14",
		"87.28",
		"EUR",
		"-1221.92",
		"-10",
		"0",
		"-1114.05",
		"0.9043259",
		"LIMIT",
		"XOFF",
		"Y",
		"15/07/2020",
		"89L4G:1021055~43137",
	],
	[
		"7/13/2020",
		"15:15:04",
		"TRADE",
		"Newmont Mining Corp",
		"BUY",
		"21",
		"62.01",
		"USD",
		"-1302.21",
		"0",
		"0",
		"-1036.26",
		"0.7957720",
		"LIMIT",
		"XOFF",
		"Y",
		"15/07/2020",
		"89L4G:1021051~42169",
	],
	[
		"7/13/2020",
		"15:10:10",
		"TRADE",
		"DraftKings Inc",
		"BUY",
		"41",
		"31.75",
		"USD",
		"-1301.75",
		"0",
		"0",
		"-1036.22",
		"0.7960216",
		"LIMIT",
		"XOFF",
		"Y",
		"15/07/2020",
		"89L4G:1021047~40990",
	],
	[
		"7/13/2020",
		"15:05:57",
		"TRADE",
		"Mimecast Limited",
		"BUY",
		"27",
		"43.135",
		"USD",
		"-1164.65",
		"0",
		"0",
		"-927.45",
		"0.7963345",
		"LIMIT",
		"XOFF",
		"Y",
		"15/07/2020",
		"89L4G:1021055~40607",
	],
	[
		"6/1/2020",
		"17:26:19",
		"TRADE",
		"Proofpoint Inc",
		"BUY",
		"11",
		"119.33",
		"USD",
		"-1312.63",
		"-10",
		"0",
		"-1068.35",
		"0.8062815",
		"LIMIT",
		"XOFF",
		"Y",
		"03/06/2020",
		"89L4G:991140~52302",
	],
	[
		"6/1/2020",
		"15:28:50",
		"TRADE",
		"Rapid7 Inc",
		"BUY",
		"25",
		"49.68",
		"USD",
		"-1242",
		"-10",
		"0",
		"-1010.62",
		"0.8056519",
		"LIMIT",
		"XOFF",
		"Y",
		"03/06/2020",
		"89L4G:991140~46964",
	],
	[
		"6/1/2020",
		"15:28:23",
		"TRADE",
		"The Simply Good Foods Company",
		"BUY",
		"75",
		"17.04",
		"USD",
		"-1278",
		"-10",
		"0",
		"-1040.22",
		"0.8061162",
		"LIMIT",
		"XOFF",
		"Y",
		"03/06/2020",
		"89L4G:991140~47025",
	],
	[
		"3/12/2020",
		"15:36:26",
		"TRADE",
		"Boost NASDAQ 100 3x Short Daily ETP",
		"SELL",
		"-4000",
		"1.15",
		"USD",
		"4600",
		"-3",
		"0",
		"-3634.99",
		"0.7908682",
		"LIMIT",
		"XOFF",
		"Y",
		"16/03/2020",
		"89L4G:934495~57397",
	],
	[
		"3/12/2020",
		"12:04:26",
		"TRADE",
		"Boost NASDAQ 100 3x Short Daily ETP",
		"SELL",
		"-4000",
		"1.1",
		"USD",
		"4400",
		"-3",
		"0",
		"-3434.04",
		"0.7811451",
		"LIMIT",
		"XOFF",
		"Y",
		"16/03/2020",
		"89L4G:934492~31974",
	],
	[
		"3/9/2020",
		"13:57:43",
		"TRADE",
		"Boost NASDAQ 100 3x Short Daily ETP",
		"BUY",
		"2000",
		"1",
		"USD",
		"-2000",
		"-3",
		"0",
		"-1536.84",
		"0.7669183",
		"LIMIT",
		"XOFF",
		"Y",
		"11/03/2020",
		"89L4G:932764~42007",
	],
	[
		"3/9/2020",
		"13:56:09",
		"TRADE",
		"Boost NASDAQ 100 3x Short Daily ETP",
		"BUY",
		"2000",
		"1.01",
		"USD",
		"-2020",
		"-3",
		"0",
		"-1551.62",
		"0.7666433",
		"LIMIT",
		"XOFF",
		"Y",
		"11/03/2020",
		"89L4G:932764~42591",
	],
	[
		"3/9/2020",
		"13:53:08",
		"TRADE",
		"Boost NASDAQ 100 3x Short Daily ETP",
		"BUY",
		"2000",
		"1.03",
		"USD",
		"-2060",
		"-3",
		"0",
		"-1584.85",
		"0.7678863",
		"LIMIT",
		"XOFF",
		"Y",
		"11/03/2020",
		"89L4G:932761~41971",
	],
	[
		"3/9/2020",
		"13:47:22",
		"TRADE",
		"Boost NASDAQ 100 3x Short Daily ETP",
		"BUY",
		"2000",
		"1.059",
		"USD",
		"-2118",
		"-3",
		"0",
		"-1628.41",
		"0.7674245",
		"LIMIT",
		"XOFF",
		"Y",
		"11/03/2020",
		"89L4G:932764~42776",
	],
	[
		"3/5/2020",
		"10:19:18",
		"TRADE",
		"Boost NASDAQ 100 3x Short Daily ETP",
		"SELL",
		"-1300",
		"0.776",
		"USD",
		"1008.8",
		"-3",
		"0",
		"-773.54",
		"0.7697655",
		"LIMIT",
		"XOFF",
		"Y",
		"09/03/2020",
		"89L4G:927399~49750",
	],
	[
		"2/28/2020",
		"15:09:52",
		"TRADE",
		"Boost NASDAQ 100 3x Short Daily ETP",
		"BUY",
		"1300",
		"0.969",
		"USD",
		"-1259.7",
		"-3",
		"0",
		"-990.43",
		"0.7838595",
		"LIMIT",
		"XOFF",
		"Y",
		"03/03/2020",
		"89L4G:924318~58008",
	],
	[
		"2/25/2020",
		"15:09:12",
		"TRADE",
		"Cyber-Ark Software Ltd/Israel",
		"BUY",
		"11",
		"114.41",
		"USD",
		"-1258.51",
		"0",
		"0",
		"-974.29",
		"0.7741619",
		"LIMIT",
		"XOFF",
		"Y",
		"27/02/2020",
		"89L4G:922383~39977",
	],
	[
		"2/25/2020",
		"15:08:53",
		"TRADE",
		"Prosus NV (NL)",
		"BUY",
		"22",
		"68.229",
		"EUR",
		"-1501.04",
		"-10",
		"0",
		"-1267.66",
		"0.8389297",
		"LIMIT",
		"XOFF",
		"Y",
		"27/02/2020",
		"89L4G:922383~39956",
	],
	[
		"2/25/2020",
		"15:08:25",
		"TRADE",
		"Mimecast Limited",
		"BUY",
		"27",
		"46.14",
		"USD",
		"-1245.78",
		"0",
		"0",
		"-964.51",
		"0.7742210",
		"LIMIT",
		"XOFF",
		"Y",
		"27/02/2020",
		"89L4G:922387~41728",
	],
	[
		"2/21/2020",
		"20:58:57",
		"TRADE",
		"Mimecast Limited",
		"BUY",
		"27",
		"46.46",
		"USD",
		"-1254.42",
		"0",
		"0",
		"-972.68",
		"0.7754058",
		"LIMIT",
		"XOFF",
		"Y",
		"25/02/2020",
		"89L4G:920163~50521",
	],
	[
		"2/20/2020",
		"15:50:34",
		"TRADE",
		"Blue Prism PLC",
		"BUY",
		"74",
		"1609",
		"GBP",
		"-1190.66",
		"-3",
		"0",
		"-1193.66",
		"1.0000000",
		"LIMIT",
		"XOFF",
		"Y",
		"24/02/2020",
		"89L4G:918921~35672",
	],
	[
		"2/20/2020",
		"15:50:14",
		"TRADE",
		"Cyber-Ark Software Ltd/Israel",
		"BUY",
		"11",
		"123.86",
		"USD",
		"-1362.46",
		"0",
		"0",
		"-1063.62",
		"0.7806610",
		"LIMIT",
		"XOFF",
		"Y",
		"24/02/2020",
		"89L4G:918917~35539",
	],
	[
		"2/19/2020",
		"15:16:53",
		"TRADE",
		"StoneCo Limited",
		"BUY",
		"32",
		"43.2",
		"USD",
		"-1382.4",
		"0",
		"0",
		"-1072.55",
		"0.7758593",
		"LIMIT",
		"XOFF",
		"Y",
		"21/02/2020",
		"89L4G:918916~37774",
	],
	[
		"2/11/2020",
		"15:43:56",
		"TRADE",
		"The Simply Good Foods Company",
		"BUY",
		"56",
		"24.69",
		"USD",
		"-1382.64",
		"0",
		"0",
		"-1073.15",
		"0.7761589",
		"LIMIT",
		"XOFF",
		"Y",
		"13/02/2020",
		"89L4G:914874~37099",
	],
	[
		"2/6/2020",
		"14:05:29",
		"TRADE",
		"Blue Prism PLC",
		"BUY",
		"74",
		"1772.7838",
		"GBP",
		"-1311.86",
		"-5",
		"0",
		"-1316.86",
		"1.0000000",
		"LIMIT",
		"XOFF",
		"Y",
		"10/02/2020",
		"89L4G:911430~42985",
	],
	[
		"2/4/2020",
		"12:55:49",
		"TRADE",
		"Prosus NV",
		"BUY",
		"22",
		"68.4",
		"EUR",
		"-1504.8",
		"-10",
		"0",
		"-1292.33",
		"0.8531373",
		"LIMIT",
		"XOFF",
		"Y",
		"06/02/2020",
		"89L4G:908736~57607",
	],
	[
		"1/24/2020",
		"14:31:59",
		"TRADE",
		"ServiceNow Inc",
		"BUY",
		"6",
		"316.6",
		"USD",
		"-1899.6",
		"-15",
		"0",
		"-1469.49",
		"0.7675183",
		"LIMIT",
		"XOFF",
		"Y",
		"28/01/2020",
		"89L4G:903440~32620",
	],
	[
		"1/24/2020",
		"14:31:52",
		"TRADE",
		"Splunk Inc",
		"BUY",
		"12",
		"160.84",
		"USD",
		"-1930.08",
		"-15",
		"0",
		"-1493.07",
		"0.7676180",
		"LIMIT",
		"XOFF",
		"Y",
		"28/01/2020",
		"89L4G:903436~31908",
	],
	[
		"1/8/2020",
		"15:50:56",
		"TRADE",
		"Rapid7 Inc",
		"BUY",
		"22",
		"60.18",
		"USD",
		"-1323.96",
		"-15",
		"0",
		"-1025.92",
		"0.7662105",
		"LIMIT",
		"XOFF",
		"Y",
		"10/01/2020",
		"89L4G:892672~32746",
	],
	[
		"1/8/2020",
		"15:50:09",
		"TRADE",
		"STAG Industrial Inc",
		"BUY",
		"42",
		"31.26",
		"USD",
		"-1312.92",
		"-15",
		"0",
		"-1017.46",
		"0.7662076",
		"LIMIT",
		"XOFF",
		"Y",
		"10/01/2020",
		"89L4G:892669~32934",
	],
	[
		"1/8/2020",
		"15:49:51",
		"TRADE",
		"ServiceNow Inc",
		"BUY",
		"5",
		"295.51",
		"USD",
		"-1477.55",
		"-15",
		"0",
		"-1143.6",
		"0.7662105",
		"LIMIT",
		"XOFF",
		"Y",
		"10/01/2020",
		"89L4G:892672~32707",
	],
	[
		"1/8/2020",
		"15:49:21",
		"TRADE",
		"LivePerson Inc",
		"BUY",
		"35",
		"37.71",
		"USD",
		"-1319.85",
		"-15",
		"0",
		"-1022.79",
		"0.7662222",
		"LIMIT",
		"XOFF",
		"Y",
		"10/01/2020",
		"89L4G:892675~32513",
	],
	[
		"12/30/2019",
		"09:40:59",
		"CORPORATE ACTION",
		"Pivotal Software Inc",
		"SELL",
		"-123",
		"15",
		"USD",
		"1845",
		"",
		"0",
		"-1396.25",
		"0.7567777",
		"LIMIT",
		"",
		"Y",
		"08/01/2020",
		"Z8750-BL197154",
	],
	[
		"12/17/2019",
		"16:35:19",
		"TRADE",
		"Puma SE",
		"BUY",
		"20",
		"67.55",
		"EUR",
		"-1351",
		"-10",
		"0",
		"-1161.22",
		"0.8532133",
		"LIMIT",
		"XOFF",
		"Y",
		"19/12/2019",
		"89L4G:884196~13877",
	],
	[
		"12/17/2019",
		"15:39:26",
		"TRADE",
		"Wix.com Ltd",
		"BUY",
		"10",
		"119.52",
		"USD",
		"-1195.2",
		"-15",
		"0",
		"-923.93",
		"0.7634574",
		"LIMIT",
		"XOFF",
		"Y",
		"19/12/2019",
		"89L4G:884196~12879",
	],
	[
		"9/17/2019",
		"17:23:49",
		"TRADE",
		"Wix.com Ltd",
		"BUY",
		"11",
		"124.11",
		"USD",
		"-1365.21",
		"-15",
		"0",
		"-1109.86",
		"0.8041222",
		"LIMIT",
		"XOFF",
		"Y",
		"19/09/2019",
		"89L4G:831044~13943",
	],
	[
		"8/8/2019",
		"17:42:15",
		"TRADE",
		"salesforce.com Inc",
		"BUY",
		"17",
		"144.49",
		"USD",
		"-2456.33",
		"-15",
		"0",
		"-2043.71",
		"0.8269699",
		"LIMIT",
		"XOFF",
		"Y",
		"12/08/2019",
		"89L4G:809638~12537",
	],
	[
		"8/6/2019",
		"16:22:02",
		"TRADE",
		"GoDaddy Inc",
		"BUY",
		"18",
		"65.39",
		"USD",
		"-1177.02",
		"-15",
		"0",
		"-985.3",
		"0.8265788",
		"LIMIT",
		"XOFF",
		"Y",
		"08/08/2019",
		"89L4G:809636~16026",
	],
	[
		"8/5/2019",
		"15:45:33",
		"TRADE",
		"SAP AG - ADR",
		"BUY",
		"10",
		"118.59",
		"USD",
		"-1185.9",
		"-15",
		"0",
		"-991.48",
		"0.8256146",
		"LIMIT",
		"XOFF",
		"Y",
		"07/08/2019",
		"89L4G:807022~13455",
	],
	[
		"8/5/2019",
		"15:43",
		"TRADE",
		"Splunk Inc",
		"BUY",
		"11",
		"121.23",
		"USD",
		"-1333.53",
		"-15",
		"0",
		"-1113.37",
		"0.8256214",
		"LIMIT",
		"XOFF",
		"Y",
		"07/08/2019",
		"89L4G:807025~13742",
	],
	[
		"8/5/2019",
		"15:38:38",
		"TRADE",
		"OneSpan Inc",
		"BUY",
		"90",
		"13.37",
		"USD",
		"-1203.3",
		"-15",
		"0",
		"-1006.08",
		"0.8258079",
		"LIMIT",
		"XOFF",
		"Y",
		"07/08/2019",
		"89L4G:807019~13280",
	],
	[
		"8/5/2019",
		"15:38:26",
		"TRADE",
		"Zendesk Inc",
		"BUY",
		"16",
		"76.61",
		"USD",
		"-1225.76",
		"-15",
		"0",
		"-1024.65",
		"0.8258215",
		"LIMIT",
		"XOFF",
		"Y",
		"07/08/2019",
		"89L4G:807025~13618",
	],
	[
		"8/5/2019",
		"15:38:15",
		"TRADE",
		"Tufin Limited",
		"BUY",
		"61",
		"20.14",
		"USD",
		"-1228.54",
		"-15",
		"0",
		"-1026.94",
		"0.8258215",
		"LIMIT",
		"XOFF",
		"Y",
		"07/08/2019",
		"89L4G:807019~13272",
	],
	[
		"8/5/2019",
		"15:30:25",
		"TRADE",
		"DocuSign Inc",
		"BUY",
		"24",
		"44.98",
		"USD",
		"-1079.52",
		"-15",
		"0",
		"-904.02",
		"0.8259539",
		"LIMIT",
		"XOFF",
		"Y",
		"07/08/2019",
		"89L4G:807025~13463",
	],
	[
		"8/2/2019",
		"17:43:15",
		"TRADE",
		"New Relic Inc",
		"BUY",
		"14",
		"87.74",
		"USD",
		"-1228.36",
		"-15",
		"0",
		"-1028.84",
		"0.8274704",
		"LIMIT",
		"XOFF",
		"Y",
		"06/08/2019",
		"89L4G:805859~17662",
	],
	[
		"8/2/2019",
		"17:43:02",
		"TRADE",
		"salesforce.com Inc",
		"BUY",
		"8",
		"147.22",
		"USD",
		"-1177.76",
		"-15",
		"0",
		"-987.04",
		"0.8275249",
		"LIMIT",
		"XOFF",
		"Y",
		"06/08/2019",
		"89L4G:805855~17111",
	],
	[
		"8/2/2019",
		"14:30:10",
		"TRADE",
		"GoDaddy Inc",
		"BUY",
		"18",
		"72.91",
		"USD",
		"-1312.38",
		"-15",
		"0",
		"-1099.81",
		"0.8285585",
		"LIMIT",
		"XOFF",
		"Y",
		"06/08/2019",
		"89L4G:805859~11123",
	],
	[
		"8/2/2019",
		"14:30:04",
		"TRADE",
		"Zendesk Inc",
		"BUY",
		"16",
		"82.25",
		"USD",
		"-1316",
		"-15",
		"0",
		"-1102.81",
		"0.8285585",
		"LIMIT",
		"XOFF",
		"Y",
		"06/08/2019",
		"89L4G:805851~11544",
	],
	[
		"7/24/2019",
		"14:30:01",
		"TRADE",
		"Wix.com Ltd",
		"BUY",
		"9",
		"143.74",
		"USD",
		"-1293.66",
		"-15",
		"0",
		"-1053.11",
		"0.8047243",
		"LIMIT",
		"XOFF",
		"Y",
		"26/07/2019",
		"89L4G:801735~9731",
	],
	[
		"7/22/2019",
		"15:56:33",
		"TRADE",
		"SAP AG - ADR",
		"BUY",
		"10",
		"124.88",
		"USD",
		"-1248.8",
		"-15",
		"0",
		"-1016.43",
		"0.8042670",
		"LIMIT",
		"XOFF",
		"Y",
		"24/07/2019",
		"89L4G:801733~12779",
	],
	[
		"7/15/2019",
		"17:07:37",
		"TRADE",
		"DocuSign Inc",
		"BUY",
		"24",
		"53.75",
		"USD",
		"-1290",
		"-15",
		"0",
		"-1047.46",
		"0.8026483",
		"LIMIT",
		"XOFF",
		"Y",
		"17/07/2019",
		"89L4G:798322~13689",
	],
	[
		"7/11/2019",
		"17:41:25",
		"TRADE",
		"OneSpan Inc",
		"BUY",
		"90",
		"14.4",
		"USD",
		"-1296",
		"-15",
		"0",
		"-1052.23",
		"0.8026131",
		"LIMIT",
		"XOFF",
		"Y",
		"15/07/2019",
		"89L4G:796684~17484",
	],
	[
		"7/11/2019",
		"17:40:56",
		"TRADE",
		"salesforce.com Inc",
		"BUY",
		"8",
		"158.42",
		"USD",
		"-1267.36",
		"-15",
		"0",
		"-1029.28",
		"0.8026419",
		"LIMIT",
		"XOFF",
		"Y",
		"15/07/2019",
		"89L4G:796684~17483",
	],
	[
		"6/24/2019",
		"16:33:12",
		"TRADE",
		"Medifast Inc",
		"BUY",
		"10",
		"127",
		"USD",
		"-1270",
		"-15",
		"0",
		"-1014.59",
		"0.7895698",
		"LIMIT",
		"XOFF",
		"Y",
		"26/06/2019",
		"89L4G:787791~8981",
	],
	[
		"6/19/2019",
		"14:30:02",
		"TRADE",
		"Elastic B.V.",
		"BUY",
		"17",
		"75.88",
		"USD",
		"-1289.96",
		"-15",
		"0",
		"-1040.84",
		"0.7976064",
		"LIMIT",
		"XOFF",
		"Y",
		"21/06/2019",
		"89L4G:785821~6651",
	],
	[
		"6/18/2019",
		"17:28:22",
		"TRADE",
		"New Relic Inc",
		"BUY",
		"14",
		"96.67",
		"USD",
		"-1353.38",
		"-15",
		"0",
		"-1096.11",
		"0.8010266",
		"LIMIT",
		"XOFF",
		"Y",
		"20/06/2019",
		"89L4G:783133~7923",
	],
	[
		"6/18/2019",
		"14:30:10",
		"TRADE",
		"Tufin Limited",
		"BUY",
		"61",
		"21.45",
		"USD",
		"-1308.45",
		"-15",
		"0",
		"-1062.1",
		"0.8025202",
		"LIMIT",
		"XOFF",
		"Y",
		"20/06/2019",
		"89L4G:783125~8063",
	],
	[
		"6/13/2019",
		"14:30:01",
		"TRADE",
		"Splunk Inc",
		"BUY",
		"11",
		"116.13",
		"USD",
		"-1277.43",
		"-15",
		"0",
		"-1023.52",
		"0.7919310",
		"LIMIT",
		"XOFF",
		"Y",
		"17/06/2019",
		"89L4G:780304~8049",
	],
	[
		"6/6/2019",
		"14:30:01",
		"TRADE",
		"Pivotal Software Inc",
		"BUY",
		"123",
		"10.805935",
		"USD",
		"-1329.13",
		"-15",
		"0",
		"-1062.98",
		"0.7908342",
		"LIMIT",
		"XOFF",
		"Y",
		"10/06/2019",
		"89L4G:778101~18002",
	]
];

const ccc = config.connection;
const connection = mongoose.connection;
connection.once('open', () => {
	console.log('Database connected..');
	main();
}).catch(err => {
	console.log('Connection failed..');
})

async function main() {
	await connection.dropDatabase()

	const user_result = await create(userData, UserModel)
	if (user_result) {
		portfolioData.user_id = user_result._id
		const portfolio_result = await create(portfolioData, PortfolioModel)

		const update_user_data = {
			id: portfolio_result._id,
			name: portfolio_result.name
		}
		const user_update = await updateUserByPortfolio(user_result._id, update_user_data, UserModel)

		if (portfolio_result) {

			let count = 0;
			let allDatum = [];
			for (var i = 0; i < transactionData.length; i++) {
				let item = transactionData[i]

				let name = item[3]

				var regexp = /\s(ltd|limited|inc|b\.v\.|NV.*|plc|AG.*|SE)/i;
				name = name.replace(regexp, "");
				name = name.replace(/\-|\/.*/g, "");

				let insert_data = {
					_id: new mongoose.Types.ObjectId(),
					name: name,
					ticker: '',
					date: new Date(`${item[0]} ${item[1]}`),
					direction: item[4],
					price: item[6],
					quantity: item[5],
					commission: item[10],
					currency: item[7],
					total: (Number(item[6]) * Number(item[5]) + Number(item[10]))
				};

				let ticker = ''

				try {
					const api_result = await axios.get(`${config.eodhistorical_api}${item[3]}?api_token=${config.eodhistorical_token}&limit=15`, {
						"Content-type": "application/json",
					});

					const datum = api_result.data;
					let final_result = [];
					let temp = {}

					if (datum.length === 0) {
						ticker = 'UNKNOWN'
					}
					else {
						for (var j = 0; j < datum.length; j++) {
							if (datum[j].ISIN != null) {
								final_result.push(datum[j])
								break;
							}
						}

						if (final_result.length === 0) {
							temp = datum[0]
						}
						else {
							temp = final_result[0]
						}

						ticker = temp.Code
					}
				} catch (e) {
					ticker = 'UNKNOWN'
				}

				insert_data.ticker = ticker;
				console.log('---------------', i)
				console.log(insert_data);
				allDatum.push(insert_data)
			}

			for (var i = 0; i < allDatum.length; i++) {
				let insert_data = allDatum[i];
				const user_update = await updatePortfolioByTransaction(portfolio_result._id, insert_data, PortfolioModel)
			}
		}
	}
}

// main();