set REGISTRY_USER=willsofts
set REGISTRY_PASSWORD=Tassan@2024
set IMAGE_NAME=willsofts/vueserve
set APP_NAME=willsofts/vueserve
set APP_VERSION=1.0.0
docker login --username %REGISTRY_USER% --password %REGISTRY_PASSWORD%
docker tag %IMAGE_NAME% %APP_NAME%:%APP_VERSION%
docker tag %IMAGE_NAME% %APP_NAME%:latest
docker push %APP_NAME%:%APP_VERSION%
docker push %APP_NAME%:latest
