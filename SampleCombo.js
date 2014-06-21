Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items:{ html:'<a href="https://help.rallydev.com/apps/2.0rc3/doc/">App SDK 2.0rc3 Docs</a>'},
    
    launch: function() {
        //setting up the container for control layout.
        this.topContainer = Ext.create('Ext.container.Container',{
            layout: {
                type: 'vbox',
                align: 'left',
                padding: 10
            }
        });
        this.add(this.topContainer);
        
        this._loadIndustryEpicData();
        
    },
    
    
    _loadIndustryEpicData: function(){
            
            // If the store exists, just reload data
            if(this.myStore){
                this.myStore.load();
            }
            // else create the store
            else{
                    this.myStore = Ext.create('Rally.data.wsapi.Store', {
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
                             this._loadEpicComboData(data);
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
        
        _loadEpicComboData: function(industryEpicLoadData){
            
            //get all the epic data for populating combobox.
            var epicComboStore = this._createAllEpicComboStore(industryEpicLoadData);
            
            //create the combo dropdown list control.
            this.epicSelector = Ext.create('Ext.form.ComboBox',{
                fieldLabel:'Select Epics: ',
                itemId:'industryEpicCombobox',
                store: epicComboStore,
                queryMode: 'local',
                displayField: 'Name',
                valueField: 'ID',
                width: 600,
                listeners: {
                    select: this._onEpicComboSelect,
                    ready: this._onEpicComboLoad, //need to revisit why this is not firing
                    scope: this
    			}
            });
            
            //add the combo box control to the app container.
            this.topContainer.add(this.epicSelector);
        },
        
        _onEpicComboLoad: function(){
            //required future implementation.
        },
        
        _onEpicComboSelect: function(){
            
            //retrive all epic info for selected item.
            var selectedEpic = this.down('#industryEpicCombobox').getValue();
            console.log('Selected value?', selectedEpic);
            this._loadSelectedEpicDetailsFromStore(selectedEpic);
        },
        
        _loadSelectedEpicDetailsFromStore: function(selectedEpicId){
            
            //set the filter criteria for epic details.
            var thisFilter = {
                    property: 'FormattedID',
                    value: selectedEpicId
                };
            
            //if the store already existis just load it.
             if(this.myEpicStore){
                console.log('My Epic store exists.');
                this.myEpicStore.setFilter(thisFilter);
                this.myEpicStore.load();
            }
            // else create the store
            else{
                    this.myEpicStore = Ext.create('Rally.data.wsapi.Store', {
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
                        load: function(myEpicStore, epicData, success) {
                             //load the epic deatils pane with the selected epic data.
                             this._loadEpicDetailsPanel(epicData);
                        },
                    scope:this
                    },
                    sorters: [
                                {
                                    property: 'FormattedID',
                                    direction: 'ASC'
                                }
                            ],
                    filters: [ 
                                thisFilter 
                            ]
                });
            }
            
        },
        
        _loadEpicDetailsPanel: function(selectedEpicData){
            //prepare display data for epic details panel.
            console.log('selected epic data?', selectedEpicData);
            var epicName = selectedEpicData[0].get('Name');
            var ownerName = selectedEpicData[0].get('Owner') !== null ? 
                            (selectedEpicData[0].get('Owner')['_refObjectName'] !== null? 
                                selectedEpicData[0].get('Owner')['_refObjectName'] : 'No Owner') 
                            : 'No Owner';
            var refinedEstimate = selectedEpicData[0].get('RefinedEstimate');
            var targetLaunch = selectedEpicData[0].get('c_TargetLaunch') !== null?selectedEpicData[0].get('c_TargetLaunch').toString() : 'No Target Specified';
            
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
                
                //add the panel to the container.
                this.topContainer.add(this.epicDetailPanel);
            }
        },
        
        _createAllEpicComboStore: function(industryEpicLoadData){
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
                    
            Ext.Array.each(industryEpicLoadData,function(thisIndustryEpic){
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
            var epicComboStore = Ext.create('Ext.data.Store',{
                model: 'Epic',
                data: epicDataCol,
                autoLoad: true
            });
            
            return epicComboStore;
        }

});
