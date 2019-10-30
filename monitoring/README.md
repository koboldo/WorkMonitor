# MONITORING  

[Development]
Prepare nginx - add location:
location = /stub_status {
        stub_status;
}
Sadly it's just one status for all nginx virtual servers...

[Slack alert]
Configuration 
https://medium.com/@_oleksii_/grafana-alerting-and-slack-notifications-3affe9d5f688

[Grafana] 
Grafana dashboards (monitoring/*.dashboard.json) 

[Docker compose]
All monitoring componets are running as docker containters
Remember to edit docker-compose.yml and change GF_SECURITY_ADMIN_PASSWORD
The trick is to change it BEFORE grafana container creation!