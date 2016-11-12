# opensportident.js
Open SPORTident JavaScript library.

[SPORTident](https://www.sportident.com/) is a system to time your outdoor sport activities. 

This library can be used in NodeJS or in Electron. See 'serialport' NPM module for usage in Electron.

## Example

```
import { SiPortReader, SiReadout, listSiPorts } from 'opensportident';

listSiPorts((err, ports)  => {
    if (err) {
        console.error(err);
    }
    else {
        if (!ports.length) {
            console.error('No SPORTident device found');
        }
        ports.forEach((portId) => {
            console.log(`Opening ${portId.comName} => ${portId.serialNumber}...`);

            const siPort = new SiPortReader(portId.comName, {mute: false});

            siPort.on('open', () => console.log(`Connected to ${portId.comName}`));
            siPort.on('close', () => console.log(`Closed ${portId.comName} => ${portId.serialNumber}`));
            siPort.on('error', err => console.error(`Error on ${portId.comName}: ${err}`));
            siPort.on('warning', warn => console.warn(`Warning on ${portId.comName}: ${warn}`));
            siPort.on('readout', readout => console.log(readout.debugString()));
            
            siPort.open();
        });
    }
});
```

## Outcome
```
Opening /dev/ttyUSB0 => Silicon_Labs_SPORTident_USB_to_UART_Bridge_Controller_186893...
Connected to /dev/ttyUSB0
SiCard 9: 1420154 check(Sun 14:19:20) start(Sun 14:24:07) finish(Sun 15:21:39)
          - 1:191 Sun 14:32:31
          - 2:216 Sun 14:43:06
          - 3:219 Sun 14:44:57
          - 4:208 Sun 14:54:07
          - 5:210 Sun 15:00:22
          - 6:182 Sun 15:04:50
          - 7:209 Sun 15:07:46
          - 8:225 Sun 15:11:22
          - 9:193 Sun 15:20:21
          - 10:200 Sun 15:21:28
```

## Origins
The dataframe/ folder (the complex part) is a close translation of https://github.com/sdenier/GecoSI
