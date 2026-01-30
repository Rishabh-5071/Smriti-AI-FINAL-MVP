import { useState, useEffect } from 'react'
import { useUser } from '../context/UserContext'
import { getAllConversations } from '../services/api'
import { MessageSquare, Users, Search, Filter, ChevronDown, ChevronUp, Calendar } from 'lucide-react'

const Conversations = () => {
  const { user, email } = useUser()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRelation, setFilterRelation] = useState('')
  const [expandedConversations, setExpandedConversations] = useState({})

  const relations = user?.relations || []

  // Fetch all conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!email) {
        setLoading(false)
        return
      }

      try {
        const data = await getAllConversations(email)
        setConversations(data.conversations || [])
      } catch (err) {
        console.error('Error fetching conversations:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [email])

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = searchQuery === '' ||
      conv.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.transcript?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.relation_name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRelation = filterRelation === '' || conv.relation_id === filterRelation

    return matchesSearch && matchesRelation
  })

  // Group conversations by date
  const groupedConversations = filteredConversations.reduce((groups, conv) => {
    const date = conv.timestamp ? new Date(conv.timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'Unknown Date'

    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(conv)
    return groups
  }, {})

  const toggleExpand = (id) => {
    setExpandedConversations(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Get relations with conversations for the legacy format
  const relationsWithMessages = relations.filter(
    (rel) => rel.messages && rel.messages.length > 0
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const hasAnyConversations = conversations.length > 0 || relationsWithMessages.length > 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100 mb-2">Conversations</h1>
        <p className="text-gray-400">
          View conversation history with family members and caregivers
        </p>
      </div>

      {!hasAnyConversations ? (
        <div className="card text-center py-12">
          <div className="flex flex-col items-center gap-4 mb-4">
            <img
              src="/Smriti.png"
              alt="Smriti Logo"
              className="w-16 h-16 object-contain opacity-50"
            />
            <MessageSquare className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-100 mb-2">
            No Conversations Yet
          </h2>
          <p className="text-gray-400">
            Conversations will appear here once face recognition detects and records conversations with familiar faces
          </p>
        </div>
      ) : (
        <>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterRelation}
                onChange={(e) => setFilterRelation(e.target.value)}
                className="input-field pl-10 pr-8 min-w-[200px]"
              >
                <option value="">All Relations</option>
                {relations.map((rel) => (
                  <option key={rel.id} value={rel.id}>
                    {rel.name} ({rel.relationship})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* New Conversation Format */}
          {Object.keys(groupedConversations).length > 0 && (
            <div className="space-y-6 mb-8">
              {Object.entries(groupedConversations).map(([date, convs]) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-300">{date}</h3>
                    <span className="text-sm text-gray-500">({convs.length} conversation{convs.length > 1 ? 's' : ''})</span>
                  </div>

                  <div className="space-y-4">
                    {convs.map((conv) => (
                      <div key={conv.id} className="card">
                        <div
                          className="flex items-start justify-between cursor-pointer"
                          onClick={() => toggleExpand(conv.id)}
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-gray-100">{conv.relation_name}</h4>
                                <span className="text-sm text-gray-500">{conv.relationship}</span>
                              </div>
                              <p className="text-sm text-gray-400 mt-0.5">{formatTime(conv.timestamp)}</p>
                              <p className="text-sm text-gray-300 mt-2">{conv.summary}</p>
                            </div>
                          </div>
                          <button className="text-gray-400 hover:text-gray-200">
                            {expandedConversations[conv.id] ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        </div>

                        {expandedConversations[conv.id] && conv.transcript && (
                          <div className="mt-4 pt-4 border-t border-gray-700">
                            <p className="text-xs text-gray-400 mb-2">Full Transcript:</p>
                            <div className="p-3 bg-gray-700 rounded-lg">
                              <p className="text-sm text-gray-200 whitespace-pre-wrap">{conv.transcript}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Legacy Messages Format (for backward compatibility) */}
          {relationsWithMessages.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-300">Previous Messages</h3>
              {relationsWithMessages.map((relation) => (
                <div key={relation.id} className="card">
                  <div className="flex items-start gap-4 mb-4">
                    {relation.photo ? (
                      <img
                        src={relation.photo}
                        alt={relation.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-gray-100">{relation.name}</h3>
                      <p className="text-sm text-gray-400">{relation.relationship}</p>
                    </div>
                  </div>

                  {relation.summary && (
                    <div className="mb-4 p-4 bg-primary-900/30 rounded-lg border border-primary-700">
                      <p className="text-sm font-medium text-primary-200 mb-1">
                        Conversation Summary
                      </p>
                      <p className="text-sm text-primary-100">{relation.summary}</p>
                    </div>
                  )}

                  {relation.messages && relation.messages.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">
                        Messages ({relation.messages.length})
                      </h4>
                      {relation.messages.map((message, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-gray-700 rounded-lg border border-gray-600"
                        >
                          {typeof message === 'string' ? (
                            <p className="text-sm text-gray-200">{message}</p>
                          ) : (
                            <div>
                              {message.message && (
                                <p className="text-sm text-gray-200 mb-2">{message.message}</p>
                              )}
                              {message.summary && (
                                <p className="text-xs text-gray-400 italic">
                                  Summary: {message.summary}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {relation.count && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <p className="text-xs text-gray-400">
                        Total interactions: {relation.count.value}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* No results message */}
          {filteredConversations.length === 0 && relationsWithMessages.length === 0 && (
            <div className="card text-center py-8">
              <p className="text-gray-400">No conversations match your search or filter.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Conversations
