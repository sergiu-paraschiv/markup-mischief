require.config({
    paths: {
        'react': './node_modules/react/umd/react.development',
        'react-dom': './node_modules/react-dom/umd/react-dom.development',
        'antd': './node_modules/antd/dist/antd',
        'dayjs': './node_modules/dayjs/dayjs.min'
    },
    map: {
        '*': {
            'react-dom/client': 'react-dom'
        }
    },
});

require([ 'main' ]);
