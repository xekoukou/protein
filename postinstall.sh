PREFIX="$(npm config get prefix)"
echo "#!/usr/bin/env node\n var prefix = '$PREFIX'\n\n;"|cat - $PREFIX/lib/node_modules/protein/protein.js > /tmp/out && mv /tmp/out $PREFIX/lib/node_modules/protein/protein.js
chmod a+xr-w /usr/bin/protein

