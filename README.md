# opensportident.js
Open SPORTident JavaScript library.

[SPORTident](https://www.sportident.com/) is a system to time your outdoor sport activities. 

This library can be used in NodeJS or in Electron. See 'serialport' NPM module for usage in Electron.

## Example

```typescript
import { SiPortReader, SiReadout, listSiPorts, SiPortId } from './opensportident';

listSiPorts((err, ports)  => {
    if (err) {
        console.error(err);
    }
    else {
        if (!ports.length) {
            console.error('No SPORTident device found');
        }
        ports.forEach((portId: SiPortId) => {
            console.log(`Opening ${portId.comName} => ${portId.serialNumber}...`);

            const siPort = new SiPortReader(portId.comName, {mute: false});

            siPort.on('open', (mode) => console.log(`Connected to ${portId.comName} ${JSON.stringify(mode)})`));
            siPort.on('close', () => console.log(`Closed ${portId.comName} => ${portId.serialNumber}`));
            siPort.on('error', err => console.error(`Error on ${portId.comName}: ${err}`));
            siPort.on('warning', warn => console.warn(`Warning on ${portId.comName}: ${warn}`));
            siPort.on('readout', (readout: SiReadout) => console.log(readout.toDebugString()));
            
            siPort.open();
        });
    }
});
```

## Outcome
```
Opening /dev/ttyUSB0 => Silicon_Labs_SPORTident_USB_to_UART_Bridge_Controller_186893...
Connected to /dev/ttyUSB0 {"siCard6Punches":192,"baudRate":38400})
SiCard 10/11/SIAC: 7420103 check(Sun 09:09:02) start(no time) finish(Sun 10:12:06)
    -  1:72 Sun 09:16:46
    -  2:73 Sun 09:22:52
    -  3:75 Sun 09:26:22
    -  4:58 Sun 09:33:49
    -  5:48 Sun 09:39:18
    -  6:63 Sun 09:42:00
    -  7:37 Sun 09:45:54
    -  8:38 Sun 09:46:53
    -  9:66 Sun 09:56:11
    - 10:67 Sun 09:57:21
    - 11:68 Sun 10:00:40
    - 12:69 Sun 10:03:44
    - 13:56 Sun 10:06:56
    - 14:57 Sun 10:10:25
    - 15:255 Sun 10:11:25
SiCard 9: 1420154 check(Sun 14:19:20) start(Sun 14:24:07) finish(Sun 15:21:39)
    -  1:191 Sun 14:32:31
    -  2:216 Sun 14:43:06
```

## Origins
The dataframe/ folder (the complex part) is a close translation of https://github.com/sdenier/GecoSI
