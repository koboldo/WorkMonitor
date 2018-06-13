#!/bin/bash
#time-a-g.nist.gov:13
$(wget -t5 -O time.json https://www.worldtimeserver.com/handlers/GetData.ashx?action=GCTData&_=1522064312713)
