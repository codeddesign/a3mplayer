#! /bin/bash

cd $(dirname $0)

if [ "$1" = "vpaid" ]; then
    ./flex_sdk/bin/mxmlc -output ../dist/vpaid.swf ../flex/vpaid/VPAIDFlash.as -compiler.source-path ../flex/vpaid/ -target-player '10.1.0'

    exit
fi

if [ "$1" = "flv" ]; then
    ./flex_sdk/bin/mxmlc -output ../dist/flv.swf   ../flex/flv/FLVPlayer.as    -compiler.source-path ../flex/flv/   -target-player '10.1.0'

    exit
fi

./flex_sdk/bin/mxmlc -output ../dist/vpaid.swf ../flex/vpaid/VPAIDFlash.as -compiler.source-path ../flex/vpaid/ -target-player '10.1.0'
./flex_sdk/bin/mxmlc -output ../dist/flv.swf   ../flex/flv/FLVPlayer.as    -compiler.source-path ../flex/flv/   -target-player '10.1.0'