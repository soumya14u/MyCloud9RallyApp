Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items:{ html:'<a href="https://help.rallydev.com/apps/2.0rc2/doc/">App SDK 2.0rc2 Docs</a>'},
    
    
    launch: function(){
        
        this._loadData();
    },
    
    _loadData: function(){
        
        var featFilter = Ext.create('Rally.data.wsapi.Filter', {
                         property: 'Name',
                         operator: 'Contains',
                         value: 'FEAT:'
                    });
        
        var epicFilter = Ext.create('Rally.data.wsapi.Filter', {
                         property: 'Name',
                         operator: 'Contains',
                         value: 'EPIC:'
                    });
        var thisFilter = featFilter.or(epicFilter);
        
        if(this.gridStore){
            this.gridStore.setFilter(thisFilter);
            this.gridStore.load();
        }
        // else create the store
        else{
        
                this.gridStore = Ext.create('Rally.data.wsapi.Store', {
                model: 'User Story',
                fetch: ['FormattedID', 'Name', 'ScheduleState', 'Project', 'Owner'],
                autoLoad: true,
                context: {
                   workspace: '/workspace/1089940415',
                    project: '/project/1694641494',
                    projectScopeUp: false,
                    projectScopeDown: true
                },
                filters:[
                        thisFilter
                    ],
                listeners: {
                    load: function(gridStore, data, success) {
                        this._loadGrid(gridStore);
                    },
                    scope:this
                },
                sorters: [
                            {
                                property: 'Project',
                                direction: 'ASC'
                            }
                        ]
                
            });
        }
    },
    
    _loadGrid: function(myStoryStore){
        var myGrid = Ext.create('Rally.ui.grid.Grid', {
                        store: myStoryStore,
                        columnCfgs: [
                                'FormattedID', 'Name', 'ScheduleState', 'Project', 'Owner'
                            ]
                    });
                    this.add(myGrid);
    }
});
