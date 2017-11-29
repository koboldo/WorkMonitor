==============#How to run (development):==============

npm install

# this executes ng serve with proxy 
npm start


==============#How to run (production):==============

#create dist dir
ng build -prod 

#nginx does not support relative paths!

# dist dir created
make symbolic links for certs and dist according to nginx.conf
 
sudo nginx -c /home/laros/git/WorkMonitor/code/frontend/nginx.conf