FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY proxy.conf /etc/nginx/proxy.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
