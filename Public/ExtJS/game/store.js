Ext.define('Quiz.store.ScoreBoard',{
    extend: 'Ext.data.Store',
    alias: 'store.scoreBoard',

    fields: ['id', 'points'],
    proxy: {
        type: 'ajax',
        url: `/quizmembers/1`,
        reader: {
            type: 'json'
        }
    },
    autoLoad: true
})