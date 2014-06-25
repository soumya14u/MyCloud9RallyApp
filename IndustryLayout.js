Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items:[
        { html:'<a href="https://help.rallydev.com/apps/2.0rc3/doc/">App SDK 2.0rc3 Docs</a>'},
        //Adding containers
                    {
                        xtype: 'container',
                        itemId: 'top',
                        style:{ 
                            type: 'vbox',
                            align: 'left',
                            padding: 10
                            }
                    },
                    {
                        xtype: 'container',
                        itemId: 'middle',
                        style:{ 
                            type: 'hbox',
                            align: 'fit',
                            padding: 20,
                            marginBottom:'10px'
                            }
                    },
                    {
                        xtype: 'container',
                        itemId: 'bottom',
                        style:{ 
                            type: 'hbox',
                            align: 'fit',
                            padding: 10,
                           
                            }
                    }
    
    
    ],
    layout:{
        type:'vbox',
        align:'stretch',
        padding:20
    },
   
   //declaring all global variables.
    industryEpicStore : undefined,          //stores all epics of Industry Solutions.
    epicComboStore : undefined,             //store all data to be displayed in Epic Combo.
    selectedIndustryEpicID: undefined,      //contains selected Industry Epic ID
    selectedIndustryEpicData: undefined,    //contains selected Industry Epic data
  
   
    launch: function() {
        //Write app code here
   
            this._loadIndustryEpicDataStore();
      
     
        
        
  },
     
    _loadIndustryEpicDataStore: function(){
            
            // If the store exists, just reload data
            if(this.industryEpicStore){
                this.industryEpicStore.load();
            }
            // else create the store
            else{
                    this.industryEpicStore = Ext.create('Rally.data.wsapi.Store', {
                    model: 'PortfolioItem/Epic',
                    fetch: ['Name', 'State', 'FormattedID', 'Owner', 'Tags', 'RefinedEstimate', 'c_TargetLaunch'],
                    autoLoad: true,
                    context: {
                        workspace: '/workspace/1089940415',
                        project: '/project/11656855707',
                        projectScopeUp: false,
                        projectScopeDown: true
                    },
                    listeners: {
                        load: function(myStore, data, success) {
                             this._loadEpicComboBox();
                        },
                        scope:this
                    },
                    sorters: [
                                {
                                    property: 'FormattedID',
                                    direction: 'ASC'
                                }
                            ]
                });
            }
            
        },
        
    _loadEpicComboBox: function(){
        if(this.industryEpicStore)
            {
                //get all the epic data for populating combobox.
                this._createAllEpicComboStore(this.industryEpicStore.getRecords());
                
                if(this.epicComboStore)
                {
                    //create the combo dropdown list control.
                    this.epicSelector = Ext.create('Ext.form.ComboBox',{
                        fieldLabel:'Select Epics: ',
                        itemId:'industryEpicCombobox',
                        store: this.epicComboStore,
                        queryMode: 'local',
                        displayField: 'Name',
                        valueField: 'ID',
                        width: 600,
                        listeners: {
                            select: this._onEpicComboBoxSelect,
                            ready: this._onEpicComboBoxLoad, //need to revisit why this is not firing
                            scope: this
            			}
                    });
                    
                    //add the combo box control to the app container.
                    
                
                    this.down('#top').add(this.epicSelector);
                }
            }
        },
        
       
    _onEpicComboBoxLoad: function(){
            //required future implementation.
        },
        
    _onEpicComboBoxSelect: function(){
            
            //retrive all epic info for selected item.
            this.selectedIndustryEpicID = this.down('#industryEpicCombobox').getValue();
            console.log('Selected value?', this.selectedIndustryEpicID);
            this._loadSelectedEpicDetailsFromStore();
        },
        
    _loadSelectedEpicDetailsFromStore: function(){
            
            if(this.industryEpicStore && this.selectedIndustryEpicID){
                var records = this.industryEpicStore.getRecords();
                var index = this.industryEpicStore.find('FormattedID', this.selectedIndustryEpicID);
                this.selectedIndustryEpicData = records[index];
                console.log('Selected records from my Store', this.selectedIndustryEpicData);
                this._loadEpicDetailsPanel();
                this._loadGridData();
                    
            }
        },
           
    _loadEpicDetailsPanel: function(){
            
        if(this.selectedIndustryEpicData){
                //prepare display data for epic details panel.
                console.log('selected epic data?', this.selectedIndustryEpicData);
                var epicName = this.selectedIndustryEpicData.get('Name');
                var ownerName = this.selectedIndustryEpicData.get('Owner') !== null ? 
                                (this.selectedIndustryEpicData.get('Owner')['_refObjectName'] !== null? 
                                    this.selectedIndustryEpicData.get('Owner')['_refObjectName'] : 'No Owner') 
                                : 'No Owner';
                var refinedEstimate = this.selectedIndustryEpicData.get('RefinedEstimate');
                var targetLaunch = this.selectedIndustryEpicData.get('c_TargetLaunch') !== null?this.selectedIndustryEpicData.get('c_TargetLaunch').toString() : 'No Target Specified';
                
                //if the epic panel already exists update the item values.
            if(this.epicDetailPanel)
                {
                    console.log('update existing panel.');
                    this.epicDetailPanel.getForm().findField('name').setValue(epicName);
                    this.epicDetailPanel.getForm().findField('owner').setValue(ownerName);
                    this.epicDetailPanel.getForm().findField('refined_estimate').setValue(refinedEstimate);
                    this.epicDetailPanel.getForm().findField('target_launch').setValue(targetLaunch);
                }
                //else create the epic details panel and display the epic data.
            else
                {
                    console.log('create new panel.');
                    this.epicDetailPanel = Ext.create('Ext.form.Panel', {
                        renderTo: Ext.getBody(),
                        width: 500,
                        height: 150,
                        layout: {
                            type: 'vbox',
                            align: 'stretch',
                            padding: 10
                        },
                        title: 'Epic Details',
                        items: [
                        {
                            xtype: 'displayfield',
                            fieldLabel: 'Name',
                            name: 'name',
                            value: epicName
                        }, 
                        {
                            xtype: 'displayfield',
                            fieldLabel: 'Owner',
                            name: 'owner',
                            value: ownerName
                        }, 
                        {
                            xtype: 'displayfield',
                            fieldLabel: 'Refined Estimate',
                            name: 'refined_estimate',
                            value: refinedEstimate
                        }, 
                        {
                            xtype: 'displayfield',
                            fieldLabel: 'Target Launch',
                            name: 'target_launch',
                            value: targetLaunch
                        }]
                });
                    
                   
                    this.down('#middle').add(this.epicDetailPanel);
                }
            }
        },
        
        
    _createAllEpicComboStore: function(){
        
        if(this.industryEpicStore)
        {
            //define the custom model for combo box data.
            Ext.define('Epic', {
                        extend: 'Ext.data.Model',
                        fields: [
                            {name: 'ID',  type: 'string'},
                            {name: 'Name', type: 'string'}
                        ]
                    });
            
            //fetch the epic data for Combo list.
            var epicDataCol = [];
                    
            Ext.Array.each(this.industryEpicStore.getRecords(),function(thisIndustryEpic){
                var epicName = thisIndustryEpic.get('Name');
                var epicId = thisIndustryEpic.get('FormattedID');
                var epicComboName = epicId + ': ' + epicName;
                //console.log('Industry Epic = ', epicComboName);
                
                var epicData = Ext.create('Epic',{
                    ID: epicId,
                    Name: epicComboName
                });
                
                epicDataCol.push(epicData);
            });
            
            //create the store for the combo list.            
            this.epicComboStore = Ext.create('Ext.data.Store',{
                    model: 'Epic',
                    data: epicDataCol,
                    autoLoad: true,
                    listeners: {
                        scope:this
                    }
                });
            }
        },
        

    _createGrid: function(){
        this.myGrid = Ext.create('Rally.ui.grid.Grid', {
                    store:this.myStore,
                    columnCfgs: [
                        'FormattedID',
                         'Name',
                         'PercentDoneByStoryCount',
                         'Owner',
                         'Project',
                         'PlannedStartDate',
                         'PlannedEndDate',
                         'RefinedEstimate',
                         'State',
                         'Tags'
                         
                     ]
                     /*,
                     layout:{
                         height
                     }*/
                     });
 
        this.panelGrid=Ext.create('Ext.form.Panel', {
                        renderTo: Ext.getBody(),
                        layout: {
                            type: 'vbox',
                            align: 'stretch',
                            padding: 10
                        },
                        
                        items: [this.myGrid]
                       
                    });
        
        
        
        
        
        this.down('#bottom').add(this.panelGrid);
    },
   

    _loadGridData: function(){
        
        console.log('loading grid');
            // If the store exists, just reload data
            var thisFilter = {
                    property: 'Tags.Name',
                    value: this.selectedIndustryEpicID
                };
            
            if(this.myStore){
                console.log('myStore exists');
                this.myStore.setFilter(thisFilter);
                this.myStore.load();
            }
            // else create the store
            else{
            
                    this.myStore = Ext.create('Rally.data.wsapi.Store', {
                    model: 'PortfolioItem',
                    fetch: [ 'FormattedID',
                         'Name',
                         'PercentDoneByStoryCount',
                         'Owner',
                         'Project',
                         'PlannedStartDate',
                         'PlannedEndDate',
                         'RefinedEstimate',
                         'State',
                         'Tags'],
                    autoLoad: true,
                    context: {
                       workspace: '/workspace/1089940415',
                        project: '/project/11656852180',
                        projectScopeUp: false,
                        projectScopeDown: true
                    },
                    filters:[
                        thisFilter
                        ],
                    listeners: {
                        load: function(myStore, data, success) {
                            if (!this.myGrid) {
                                
                                this._createGrid();
                            }
                        },
                        scope:this
                    }
                    
                });
            }
           
        }
   
});