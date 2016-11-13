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

            const siPort = new SiPortReader(portId.comName, {mute: true});

            siPort.on('open', (mode) => console.log(`Connected to ${portId.comName} ${JSON.stringify(mode)})`));
            siPort.on('close', () => console.log(`Closed ${portId.comName} => ${portId.serialNumber}`));
            siPort.on('error', err => console.error(`Error on ${portId.comName}: ${err}`));
            siPort.on('warning', warn => console.warn(`Warning on ${portId.comName}: ${warn}`));
            siPort.on('readout', (readout: SiReadout) => console.log(readout.toDebugString()));
            
            siPort.open();
        });
    }
});