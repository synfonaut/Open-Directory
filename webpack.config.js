module.exports = {
    entry: [
        './public/static/js/app.js'
    ],
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/env', '@babel/react']
                    }
                }
            }
        ]
    },
    externals: [
        {
            "MoneyButton": "MoneyButton"
        }
    ],
    output: {
        filename: 'bundle.min.js',
        path: __dirname + '/public/static/js'
    }
}
