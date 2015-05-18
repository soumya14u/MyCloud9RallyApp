Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items:{},
    
    
    launch: function(){
         this._loadGridStore();
         //this._loadTreeGridStore();
         //this._loadTreeStorePanel();
    },
    
    _loadTreeStorePanel: function(){
        
        var myStore = Ext.create('Rally.data.WsapiTreeStore', {
            topLevelModels: ['portfolioitem/epic' ],
            childModels: ['portfolioitem/feature', 'hierarchicalrequirement']
        });
        
        var panel = Ext.create('Rally.ui.tree.grid.Panel',{
            store: myStore,
            columns: [{
                xtype: 'treecolumn',
                text: 'Name',
                dataIndex: 'Name',
                flex: 2
              }, {
                xtype: 'templatecolumn',
                tpl: Ext.create('Rally.ui.renderer.template.PercentDoneByStoryPlanEstimateTemplate2'),
                text: '% Done by Plan Est',
                dataIndex: 'PercentDoneByPlanEstimate',
                flex: 1
              }, {
                text: 'Schedule State',
                dataIndex: 'ScheduleState',
                flex: 1
              }]
        });
        
        this.add(panel);
    },
    
    _loadTreeGridStore: function(){
        console.log('creating tree store');
        Ext.create('Rally.data.wsapi.TreeStoreBuilder').build({
                    model: 'PortfolioItem',
                    fetch: ['Name', 'Project','State', 'FormattedID', 'Owner', 'PercentDoneByStoryCount', 'c_TargetLaunch', 'Customer', 'Notes'],
                    autoLoad: true,
                    context: {
                       workspace: '/workspace/1089940415',
                        project: '/project/11656852180',
                        projectScopeUp: false,
                        projectScopeDown: true
                    },
                    enableHierarchy: true
                }).then({
                    success: this._onTreeGridStoreBuilt,
                    scope: this
                });
    },
    
    _onTreeGridStoreBuilt: function(store){
        console.log('creating tree grid');
         this.rollupViewGrid = Ext.create('Rally.ui.grid.TreeGrid', {
                    store: store,
                    columnCfgs: [
                        'FormattedID',
                         'Name',
                         'PercentDoneByStoryCount',
                         'Owner',
                         'Project',
                         'State',
                         'c_TargetLaunch',
                         'Customer',
                         'Notes'
                     ]
                    });
        this.add(this.rollupViewGrid);
    },
    
    _getContext: function(){
        var context = {
                           workspace: '/workspace/1089940415',
                            project: '/project/11656853017',
                            projectScopeUp: false,
                            projectScopeDown: true
                        };
        return context;
    },
    
     _createGrid: function(){
        //TODO: investigate how to render a grid inside a container.
        
        this.rollupViewGrid = Ext.create('Rally.ui.grid.Grid', {
                    store:this.gridStore,
                    columnCfgs: [
                        'FormattedID',
                         'Name',
                         'PercentDoneByStoryCount',
                         'Owner',
                         'Project',
                         'State',
                         'Customer',
                         'Notes'
                     ],
                     features: [{
                            ftype: 'groupingsummary',
                            groupHeaderTpl: '{name} ({rows.length})'
                        }],
                    });
        this.add(this.rollupViewGrid);
    },
    
    _loadGridStore: function(){
        
        console.log('loading grid');
        
        if(this.gridStore){
            this.gridStore.load();
        }
        // else create the store
        else{
        
                this.gridStore = Ext.create('Rally.data.wsapi.Store', {
                                model: 'PortfolioItem',
                                fetch: ['Name', 'Project','State', 'FormattedID', 'Owner', 'PercentDoneByStoryCount', 'c_TargetLaunch', 'Customer', 'Notes'],
                                autoLoad: true,
                                context: {
                                   workspace: '/workspace/1089940415',
                                    project: '/project/11656852180',
                                    projectScopeUp: false,
                                    projectScopeDown: true
                                },
                                groupField: 'c_TargetLaunch',
                                groupDir: 'ASC',
                                getGroupString: function(record) {
                                    var targetLaunch = record.get('c_TargetLaunch');
                                    var groupTarget =  (targetLaunch !== null? targetLaunch : 'TDB');
                                    return groupTarget;
                                },
                                listeners: {
                                    load: function(gridStore, data, success) {
                                        if (!this.rollupViewGrid) {
                                            this._createGrid();
                                        }
                                    },
                                    scope:this
                                }
                
            });
        }
           
    },
    
    _onStoreBuilt: function(store) {
        this.add({
            xtype: 'rallytreegrid',
            context: this.getContext(),
            store: store,
            columnCfgs: [
                'Name',
                'ScheduleState',
                'Owner'
            ]
        });
    }
});
