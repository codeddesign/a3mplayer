#! /bin/bash
if [ -f flex_sdk/bin/mxmlc ]; then
    echo 'already installed... skipping...'
else
    mkdir flexsdk

    curl -o 'flex_sdk/flexsdk_v3_6.zip' 'http://download.macromedia.com/pub/flex/sdk/flexsdk_3.6a.zip'
    unzip 'flex_sdk/flexsdk_v3_6.zip' -d 'flex_sdk'

    # rm 'flex_sdk/flexsdk_v3_6.zip'

    chmod -R 755 './flex_sdk'

    echo 'installation complete...'

    exit
fi