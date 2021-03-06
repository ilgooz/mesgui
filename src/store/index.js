import {
  ListServicesRequest,
  DeployServiceRequest,
  DeleteServiceRequest,
  StopServiceRequest,
  StartServiceRequest,
  GetServiceRequest,
} from '../../proto/api_pb.js'
import { CoreClient} from '../../proto/api_pb_service.js'
import axios from 'axios'
import Targz from '../utils/targz'


var coreClient = new CoreClient('http://localhost:50053');

export default {
  state: {
    services: [],
    marketplace: {
      services: [
        { url:"https://github.com/mesg-foundation/service-ethereum",name: "service-ethereum", by: "mesg-foundation", text: "Ethereum Service to interact with any Smart Contract.", logo: "https://i.imgur.com/Nkj8hnb.png",isDeploying: false, },
        { url:"https://github.com/mesg-foundation/service-discord-invitation", name: "service-discord-invitation", by: "mesg-foundation", text: "Send an invitation to MESG's Discord", logo: "https://cdn3.iconfinder.com/data/icons/popular-services-brands-vol-2/512/discord-512.png",isDeploying: false, },
        { url:"https://github.com/mesg-foundation/service-webhook",name: "service-webhook", by: "mesg-foundation", text: "Receive HTTP connections and emit events with data", logo: "http://www.webhook.com/static/logo/logo.png",isDeploying: false, },
        { url:"https://github.com/Roms1383/mesg-pusher",name: "mesg-pusher", by: "Roms1383", text: "MESG Service for Pusher", logo: "https://d21buns5ku92am.cloudfront.net/67967/logo/retina-1530539712.png",isDeploying: false, },
      ]
    }
  },
  mutations: {
    updateServices(state, payload) {
      state.services = payload
    }
  },
  actions: {
    checkStatus(context){
      return new Promise((resolve) => {
        axios
        .get('http://localhost:50053')
        .then(response => {
          resolve(true)
        }).catch(err => {
          resolve(false)
        })
      })
    },
    refreshServices(context) {
      return new Promise((resolve) => {
        var request = new ListServicesRequest();
        coreClient.listServices(request, {}, function(err, response) {
          var services = []
          // eslint-disable-next-line
          response.getServicesList().forEach((service) => {
            services.push({
              hash: service.getHash(),
              sid: service.getSid(),
              selected: false,
              name: service.getName(),
              status: service.getStatus(),
            })
          })
          context.commit('updateServices', services);
          resolve();
        });
      });
    },
    startServices(context, sids){
      return new Promise((resolve) => {
        var doneCount = 0;
        sids.forEach(sid => {
          var req = new StartServiceRequest();
          req.setServiceid(sid)
          coreClient.startService(req, {}, (err)=> {
            doneCount++
            if(doneCount == sids.length) resolve();
          })
        })
      })
    },
    stopServices(context, sids){
      return new Promise((resolve) => {
        var doneCount = 0;
        sids.forEach(sid => {
          var req = new StopServiceRequest();
          req.setServiceid(sid)
          coreClient.stopService(req, {}, (err)=> {
            doneCount++
            if(doneCount == sids.length) resolve();
          })
        })
      })
    },
    deleteServices(context, sids){
      return new Promise((resolve) => {
        var doneCount = 0;
        sids.forEach(sid => {
          var req = new DeleteServiceRequest();
          req.setServiceid(sid)
          coreClient.deleteService(req, {}, (err)=> {
            doneCount++
            if(doneCount == sids.length) resolve();
          })
        })
      })
    },
    getService(context, sid){
      return new Promise((resolve) => {
        var req = new GetServiceRequest();
        req.setServiceid(sid)
        coreClient.getService(req, {}, (err, data)=> {
          resolve({name: data.getService().getName()})
        })
      })
    },
    deployServiceFromURL(context, url){
      return new Promise((resolve) => {
        var req = new DeployServiceRequest();
        req.setUrl(url)
        var stream = coreClient.deployService();
        stream.on('data', (data) => { 
          var id = data.getServiceid()
          if (id) resolve(id)
        })
        stream.write(req)
      })
    },
    deployService(context, files) {
      return new Promise((resolve) => {
        var stream = coreClient.deployService();
        stream.on('data', function(a,b){
          console.log(a)
        })


        var tar = new Targz((data) => {
          var request = new DeployServiceRequest();
          request.setChunk(data)
          stream.write(request)
        },() => {
          stream.end()
        })

        for (var i = 0; i < files.length; i++) {
          tar.add(files[i])
        }
        tar.finish()
      });
    }
  }
}
