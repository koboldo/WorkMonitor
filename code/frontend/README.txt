==============#How to run (development):==============

npm install

# this executes ng serve with proxy to backend
npm start

==============#How to run (dev with nginx):==============
nginx -c $PWD/nginx.dev.conf

==============#How to run (production):==============

#create dist dir
Angular 4 -> ng build --base-href . -prod 
Angular 6 -> ng build --base-href . --prod --configuration=production 

#nginx does not support relative paths!

# dist dir created
make symbolic links for certs and dist according to nginx.conf
 
sudo nginx -c /home/laros/git/WorkMonitor/code/frontend/nginx.conf