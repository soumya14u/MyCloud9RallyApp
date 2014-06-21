Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items:[
            {
                xtype:'container',
                itemId: 'priorityFilter'
            },
            {
                xtype: 'container',
                itemId: 'epicGrid'
            }
        ],
    
    
    launch: function(){
        
        this.down('#priorityFilter').add({
           xtype: 'rallyattributecombobox',
           itemId: 'priorityComboBox',
           model: 'PortfolioItem/Epic',
           field: 'State',
           listeners: {
               ready: this._onLoad,
               select: this._onSelect,
               scope: this
           },
           context: {
                workspace: '/workspace/1089940415',
                project: '/project/11656855707',
                projectScopeUp: false,
                projectScopeDown: true
            }
        });
        
    },
    
    _onLoad: function(comboBox){
        var epicModel = Rally.data.ModelFactory.getModel({
            type: 'PortfolioItem/Epic',
            success: this._onModelRetrieved,
            context: {
                workspace: '/workspace/1089940415',
                project: '/project/11656855707',
                projectScopeUp: false,
                projectScopeDown: true
            },
            scope: this
        });
    },
    
    _onSelect: function(){
        var filterConfig = {
                        property:'State',
                        operator: '=',
                        value: this.down('#priorityComboBox').getValue()
                    };
            
        this.epicGrid.filter(filterConfig, true, true);
    },
    
    _onModelRetrieved: function(epicModel){
        this.epicGrid = this.down('#epicGrid').add({
            xtype:'rallygrid',
            model:epicModel,
            columnCfgs:[
                     'FormattedID',
                      'Name',
                      'State',
                      'Owner',
                      'Tags'
                ],
                 storeConfig:{
                              context: this.context.getDataContext(),
                              filters:[
                                  {
                                      property:'State',
                                      operator: '=',
                                      value: this.down('#priorityComboBox').getValue()
                                  }
                              ]
                          }
                
        });
    }
    
   
});
