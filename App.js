Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items:{ html:'<a href="https://help.rallydev.com/apps/2.0rc2/doc/">App SDK 2.0rc2 Docs</a>'},
    
    
    launch: function(){
        console.log("Hello World!!");
        this._loadData();
    },
    
    _loadData: function(){
         var myStore = Ext.create('Rally.data.wsapi.Store', {
                        model:'User Story',
                        autoLoad: true,
                        listeners: {
                            load:function(myStore, myData, success){
                                console.log('got data', myStore, myData, success);
                                this._loadGrid(myStore);
                            },
                            scope: this
                        },
                        fetch: ['FormattedID', 'Name', 'ScheduleState']
                    });
    },
    
    _loadGrid: function(myStoryStore){
        var myGrid = Ext.create('Rally.ui.grid.Grid', {
                        store: myStoryStore,
                        columnCfgs: [
                                'FormattedID', 'Name', 'ScheduleState'
                            ]
                    });
                    this.add(myGrid);
                    console.log('what is this?', this);
    }
});
