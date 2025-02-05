export default {
    name: 'Block Editor',
    subtitle: 'Program your TNY-360 using blocks!',
    description: 'Use the block editor to program your TNY-360 robot in a visual way, without writing any code!',
    connect: 'Connect',
    save: 'Save',
    load: 'Load',
    new: 'New',
    connectionPopup: {
        title: 'Connect a TNY-360',
        message: 'Enter the IP address of your TNY-360 to connect it to the editor.',
        connected: 'You are connected to a TNY-360',
        connecting: 'Connecting...',
        disconnected: 'You are not connected to a TNY-360',
        error: 'Unable to connect to the specified IP address.'
    },
    disconnectedPopup: {
        title: 'You are not connected to a TNY-360',
        message: 'Connect to a TNY-360 from the "Connect" menu to run the code.',
        button: 'Okay'
    },
};